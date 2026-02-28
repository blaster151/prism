import { prisma } from "@/server/db/prisma";
import { UserRole } from "@/server/auth/rbac";
import { requireRole, type SessionUser } from "@/server/auth/requireRole";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";

import type { Prisma } from "@prisma/client";
import { DataProvenanceSource } from "@prisma/client";

export type KeyField = "fullName" | "title" | "email" | "phone";

const KEY_FIELDS: KeyField[] = ["fullName", "title", "email", "phone"];

export type CandidateRecordView = {
  recordId: string;
  version: number;
  fields: Record<string, unknown>;
  provenances: Record<
    KeyField,
    | {
        fieldName: string;
        source: DataProvenanceSource;
        lastModifiedAt: string | null;
      }
    | null
  >;
};

export async function getCandidateRecord(args: {
  user: SessionUser | undefined;
  candidateId: string;
}) {
  requireRole({ user: args.user, requiredRole: UserRole.POWER_USER });

  const candidate = await prisma.candidate.findUnique({
    where: { id: args.candidateId },
    select: { id: true },
  });
  if (!candidate) return null;

  const record =
    (await prisma.dataRecord.findUnique({
      where: { candidateId: args.candidateId },
      select: { id: true, fields: true, updatedAt: true },
    })) ??
    (await prisma.dataRecord.create({
      data: { candidateId: args.candidateId, fields: {} as Prisma.InputJsonValue },
      select: { id: true, fields: true, updatedAt: true },
    }));

  const provenances = await prisma.dataRecordFieldProvenance.findMany({
    where: { recordId: record.id, fieldName: { in: KEY_FIELDS } },
    select: { fieldName: true, source: true, lastModifiedAt: true },
  });

  const latestVersion = await prisma.dataRecordVersion.aggregate({
    where: { recordId: record.id },
    _max: { versionNumber: true },
  });

  return {
    recordId: record.id,
    version: latestVersion._max.versionNumber ?? 0,
    fields: record.fields as Record<string, unknown>,
    provenances: Object.fromEntries(
      KEY_FIELDS.map((f) => [
        f,
        (() => {
          const p = provenances.find((p) => p.fieldName === f);
          if (!p) return null;
          return {
            fieldName: p.fieldName,
            source: p.source,
            lastModifiedAt: p.lastModifiedAt ? p.lastModifiedAt.toISOString() : null,
          };
        })(),
      ]),
    ) as CandidateRecordView["provenances"],
  } satisfies CandidateRecordView;
}

export async function updateCandidateRecord(args: {
  user: SessionUser | undefined;
  candidateId: string;
  patch: Partial<Record<KeyField, string>>;
}) {
  requireRole({ user: args.user, requiredRole: UserRole.POWER_USER });

  const result = await prisma.$transaction(async (tx) => {
    const record =
      (await tx.dataRecord.findUnique({
        where: { candidateId: args.candidateId },
        select: { id: true, fields: true },
      })) ??
      (await tx.dataRecord.create({
        data: { candidateId: args.candidateId, fields: {} as Prisma.InputJsonValue },
        select: { id: true, fields: true },
      }));

    const existing = (record.fields ?? {}) as Record<string, unknown>;
    const nextFields = { ...existing };

    const changed: string[] = [];
    for (const k of KEY_FIELDS) {
      const v = args.patch[k];
      if (typeof v === "undefined") continue;
      if (existing[k] !== v) {
        nextFields[k] = v;
        changed.push(k);
      }
    }

    const updated = await tx.dataRecord.update({
      where: { id: record.id },
      data: { fields: nextFields as unknown as Prisma.InputJsonValue },
      select: { id: true, fields: true },
    });

    for (const fieldName of changed) {
      const existingProv = await tx.dataRecordFieldProvenance.findFirst({
        where: { recordId: record.id, fieldName },
        select: { id: true },
      });

      if (existingProv) {
        await tx.dataRecordFieldProvenance.update({
          where: { id: existingProv.id },
          data: {
            source: DataProvenanceSource.USER_EDITED,
            lastModifiedByUserId: args.user?.id,
            lastModifiedAt: new Date(),
          },
          select: { id: true },
        });
      } else {
        await tx.dataRecordFieldProvenance.create({
          data: {
            recordId: record.id,
            fieldName,
            source: DataProvenanceSource.USER_EDITED,
            lastModifiedByUserId: args.user?.id,
            lastModifiedAt: new Date(),
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
        actorUserId: args.user?.id,
      },
      select: { id: true },
    });

    await auditLog(
      {
        actorUserId: args.user?.id,
        eventType: AuditEventTypes.DataRecordEdit,
        entityType: "data_record",
        entityId: record.id,
        metadata: { candidateId: args.candidateId, changedFields: changed },
      },
      { tx },
    );

    return { recordId: record.id, version: nextVersion, changedFields: changed };
  });

  return result;
}

