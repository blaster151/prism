import type { Prisma, PrismaClient } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";
import { prisma } from "@/server/db/prisma";

function buildFtsText(fields: Record<string, unknown>) {
  const parts: string[] = [];
  for (const k of ["fullName", "title", "email", "phone"]) {
    const v = fields[k];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }

  // Add a bounded JSON string of the remaining fields for lexical fallback.
  const rest: Record<string, unknown> = { ...fields };
  for (const k of ["fullName", "title", "email", "phone"]) delete rest[k];
  const restStr = JSON.stringify(rest);
  if (restStr && restStr !== "{}") parts.push(restStr.slice(0, 4000));

  return parts.join("\n");
}

function deterministicEmbeddingVector(text: string) {
  // Stable 8-dim numeric vector derived from text content. Placeholder until pgvector/real embeddings.
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const vec: number[] = [];
  let x = h >>> 0;
  for (let i = 0; i < 8; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    vec.push(((x >>> 0) % 2000) / 1000 - 1); // [-1, 1)
  }
  return vec;
}

export async function runIndexForCandidate(args: {
  candidateId: string;
  actorUserId?: string;
  opts?: { tx?: Prisma.TransactionClient | PrismaClient };
}) {
  const client = args.opts?.tx ?? prisma;

  const candidate = await client.candidate.findUnique({
    where: { id: args.candidateId },
    select: { id: true },
  });
  if (!candidate) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Candidate not found.",
      httpStatus: 404,
    });
  }

  const record = await client.dataRecord.findUnique({
    where: { candidateId: args.candidateId },
    select: { id: true, fields: true },
  });
  const fields = (record?.fields ?? {}) as Record<string, unknown>;
  const ftsText = buildFtsText(fields);

  const embeddingModel = "deterministic-v0";
  const embeddingVersion = 1;
  const vector = deterministicEmbeddingVector(ftsText);

  await (typeof (client as PrismaClient).$transaction === "function"
    ? (client as PrismaClient).$transaction(async (tx) => {
        await tx.candidateSearchDocument.upsert({
          where: { candidateId: args.candidateId },
          create: { candidateId: args.candidateId, ftsText },
          update: { ftsText },
          select: { id: true },
        });

        await tx.embedding.deleteMany({
          where: {
            candidateId: args.candidateId,
            model: embeddingModel,
            version: embeddingVersion,
          },
        });
        await tx.embedding.create({
          data: {
            candidateId: args.candidateId,
            model: embeddingModel,
            version: embeddingVersion,
            vector: vector as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });

        await auditLog(
          {
            actorUserId: args.actorUserId,
            eventType: AuditEventTypes.IndexRun,
            entityType: "candidate",
            entityId: args.candidateId,
            metadata: { recordId: record?.id ?? null, ftsCharCount: ftsText.length, model: embeddingModel },
          },
          { tx },
        );
      })
    : Promise.resolve());

  // If client is a TransactionClient (already inside tx), apply without nesting.
  if (typeof (client as PrismaClient).$transaction !== "function") {
    const tx = client as Prisma.TransactionClient;
    await tx.candidateSearchDocument.upsert({
      where: { candidateId: args.candidateId },
      create: { candidateId: args.candidateId, ftsText },
      update: { ftsText },
      select: { id: true },
    });
    await tx.embedding.deleteMany({
      where: { candidateId: args.candidateId, model: embeddingModel, version: embeddingVersion },
    });
    await tx.embedding.create({
      data: {
        candidateId: args.candidateId,
        model: embeddingModel,
        version: embeddingVersion,
        vector: vector as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    await auditLog(
      {
        actorUserId: args.actorUserId,
        eventType: AuditEventTypes.IndexRun,
        entityType: "candidate",
        entityId: args.candidateId,
        metadata: { recordId: record?.id ?? null, ftsCharCount: ftsText.length, model: embeddingModel },
      },
      { tx },
    );
  }

  return { ok: true, candidateId: args.candidateId, ftsCharCount: ftsText.length, embeddingModel };
}

export const __private = { buildFtsText, deterministicEmbeddingVector };

