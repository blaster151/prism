import type { Prisma, PrismaClient } from "@prisma/client";
import { DocumentProcessingStatus } from "@prisma/client";
import type { Session } from "next-auth";

import { AppError } from "@/lib/errors";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";

import { getOcrProvider } from "./provider";

export async function runOcrForResumeDocument(args: {
  session: Session | null;
  resumeDocumentId: string;
  pdfBase64: string;
  opts?: { tx?: Prisma.TransactionClient | PrismaClient };
}) {
  const actorUserId = args.session?.user?.id;
  if (args.session) {
    requireRole({ user: args.session.user, requiredRole: UserRole.POWER_USER });
  }

  const client = args.opts?.tx ?? prisma;
  const doc = await client.resumeDocument.findUnique({
    where: { id: args.resumeDocumentId },
    select: { id: true, ocrStatus: true },
  });
  if (!doc) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "ResumeDocument not found.",
      httpStatus: 404,
    });
  }

  await auditLog({
    actorUserId,
    eventType: AuditEventTypes.OcrRun,
    entityType: "resume_document",
    entityId: doc.id,
    metadata: {
      action: "ocr",
      byteCount: Math.floor((args.pdfBase64.length * 3) / 4),
    },
  });

  // Never log raw document content.
  const pdfBytes = Buffer.from(args.pdfBase64, "base64");
  const provider = getOcrProvider();

  await client.resumeDocument.update({
    where: { id: doc.id },
    data: { ocrStatus: DocumentProcessingStatus.PENDING, ocrProvider: provider.name },
  });

  try {
    const res = await provider.ocrPdf({ pdfBytes });
    const text = res.text ?? "";

    await client.resumeDocument.update({
      where: { id: doc.id },
      data: {
        ocrStatus: DocumentProcessingStatus.COMPLETE,
        ocrProvider: res.provider,
        ocrText: text,
      },
    });

    return {
      ok: true,
      provider: res.provider,
      charCount: text.length,
      pageCount: res.pageCount ?? null,
    };
  } catch (err) {
    await client.resumeDocument.update({
      where: { id: doc.id },
      data: { ocrStatus: DocumentProcessingStatus.FAILED },
    });
    throw new AppError({
      code: "OCR_FAILED",
      message: "OCR failed.",
      httpStatus: 502,
      details: { provider: provider.name, message: err instanceof Error ? err.message : "unknown" },
    });
  }
}

