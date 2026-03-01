import type { Prisma, PrismaClient } from "@prisma/client";
import { DataProvenanceSource, DocumentProcessingStatus } from "@prisma/client";
import type { Session } from "next-auth";

import { AppError } from "@/lib/errors";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";

import { getExtractProvider } from "./provider";
import { computeExtractionChanges } from "./extractionLogic";

export async function runExtractionForResumeDocument(args: {
  session: Session | null;
  resumeDocumentId: string;
  opts?: { tx?: Prisma.TransactionClient | PrismaClient };
}) {
  const actorUserId = args.session?.user?.id;
  if (args.session) {
    requireRole({ user: args.session.user, requiredRole: UserRole.POWER_USER });
  }

  const client = args.opts?.tx ?? prisma;

  const doc = await client.resumeDocument.findUnique({
    where: { id: args.resumeDocumentId },
    select: { id: true, candidateId: true, ocrText: true },
  });
  if (!doc) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "ResumeDocument not found.",
      httpStatus: 404,
    });
  }
  if (!doc.ocrText) {
    throw new AppError({
      code: "CONFLICT",
      message: "OCR text not available.",
      httpStatus: 409,
    });
  }
  const ocrText = doc.ocrText;

  await client.resumeDocument.update({
    where: { id: doc.id },
    data: { extractionStatus: DocumentProcessingStatus.PENDING },
  });

  const provider = getExtractProvider();
  let extracted: Awaited<ReturnType<typeof provider.extract>>;
  try {
    extracted = await provider.extract({ text: ocrText });
  } catch (err) {
    await client.resumeDocument.update({
      where: { id: doc.id },
      data: { extractionStatus: DocumentProcessingStatus.FAILED },
    });
    throw new AppError({
      code: "EXTRACTION_FAILED",
      message: "Extraction failed.",
      httpStatus: 502,
      details: { provider: provider.name, message: err instanceof Error ? err.message : "unknown" },
    });
  }

  const runInTx = async (tx: Prisma.TransactionClient) => {
    const record =
      (await tx.dataRecord.findUnique({
        where: { candidateId: doc.candidateId },
        select: { id: true, fields: true },
      })) ??
      (await tx.dataRecord.create({
        data: { candidateId: doc.candidateId, fields: {} as Prisma.InputJsonValue },
        select: { id: true, fields: true },
      }));

    // Drop any previous pending suggestions for this document, re-created per run.
    await tx.extractionSuggestion.deleteMany({
      where: { resumeDocumentId: doc.id, status: "PENDING" },
    });

    const existing = (record.fields ?? {}) as Record<string, unknown>;
    const { applied, staged } = computeExtractionChanges({
      existingFields: existing,
      extracted: extracted.fields.map((f) => ({
        fieldName: f.fieldName,
        value: f.value,
        source: f.source,
      })),
    });

    const nextFields = { ...existing };
    const appliedFieldNames: string[] = [];

    for (const f of applied) {
      if (existing[f.fieldName] === f.value) continue;
      nextFields[f.fieldName] = f.value;
      appliedFieldNames.push(f.fieldName);
    }

    if (appliedFieldNames.length > 0) {
      const updated = await tx.dataRecord.update({
        where: { id: record.id },
        data: { fields: nextFields as unknown as Prisma.InputJsonValue },
        select: { id: true, fields: true },
      });

      for (const f of applied) {
        if (!appliedFieldNames.includes(f.fieldName)) continue;

        const existingProv = await tx.dataRecordFieldProvenance.findFirst({
          where: { recordId: record.id, fieldName: f.fieldName },
          select: { id: true },
        });

        const provData = {
          source: f.source,
          sourceDocumentId: doc.id,
          lastModifiedByUserId: null,
          lastModifiedAt: null,
        } as const;

        if (existingProv) {
          await tx.dataRecordFieldProvenance.update({
            where: { id: existingProv.id },
            data: provData,
            select: { id: true },
          });
        } else {
          await tx.dataRecordFieldProvenance.create({
            data: {
              recordId: record.id,
              fieldName: f.fieldName,
              ...provData,
            },
            select: { id: true },
          });
        }
      }

      const latestVersion = await tx.dataRecordVersion.aggregate({
        where: { recordId: record.id },
        _max: { versionNumber: true },
      });
      const nextVersion = (latestVersion._max.versionNumber ?? 0) + 1;
      await tx.dataRecordVersion.create({
        data: {
          recordId: record.id,
          versionNumber: nextVersion,
          fields: updated.fields as unknown as Prisma.InputJsonValue,
          actorUserId,
        },
        select: { id: true },
      });
    }

    for (const s of staged) {
      await tx.extractionSuggestion.create({
        data: {
          resumeDocumentId: doc.id,
          candidateId: doc.candidateId,
          fieldName: s.fieldName,
          existingValue: s.existingValue,
          suggestedValue: s.suggestedValue,
          source: s.source as DataProvenanceSource,
          status: "PENDING",
        },
        select: { id: true },
      });
    }

    await auditLog(
      {
        actorUserId,
        eventType: AuditEventTypes.ExtractRun,
        entityType: "resume_document",
        entityId: doc.id,
        metadata: {
          provider: extracted.provider,
          model: extracted.model?.name ?? null,
          ocrCharCount: ocrText.length,
          appliedFields: appliedFieldNames,
          stagedCount: staged.length,
        },
      },
      { tx },
    );

    return { recordId: record.id, appliedFields: appliedFieldNames, stagedCount: staged.length };
  };

  const result =
    typeof (client as PrismaClient).$transaction === "function"
      ? await (client as PrismaClient).$transaction(runInTx)
      : await runInTx(client as Prisma.TransactionClient);

  await client.resumeDocument.update({
    where: { id: doc.id },
    data: { extractionStatus: DocumentProcessingStatus.COMPLETE },
  });

  return { ok: true, ...result, provider: extracted.provider };
}

