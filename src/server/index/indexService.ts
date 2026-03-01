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

function deterministicEmbeddingVector(text: string): number[] {
  // Stable 1536-dim numeric vector derived from text content.
  // Deterministic stub — replaced by real embedding provider in Story 4.2.
  const DIMS = 1536;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const vec: number[] = [];
  let x = h >>> 0;
  for (let i = 0; i < DIMS; i++) {
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

  const embeddingModel = "deterministic-stub";
  const embeddingVersion = 1;
  const vector = deterministicEmbeddingVector(ftsText);
  // SAFE: vectorLiteral is numeric-only and always passed as a bind parameter ($4),
  // never concatenated into the SQL string. Values are from deterministicEmbeddingVector (controlled output).
  const vectorLiteral = `[${vector.join(",")}]`;

  async function applyIndexUpdates(tx: Prisma.TransactionClient) {
    // Upsert CandidateSearchDocument (ftsText + ftsVector via raw SQL for tsvector)
    await tx.candidateSearchDocument.upsert({
      where: { candidateId: args.candidateId },
      create: { candidateId: args.candidateId, ftsText },
      update: { ftsText },
      select: { id: true },
    });

    // Populate the tsvector column via raw SQL (Prisma can't write Unsupported types).
    // SAFETY: Prisma interactive tx client exposes $executeRawUnsafe at runtime.
    // Cast through unknown because Prisma.TransactionClient type omits it.
    // All values are parameterized ($1, $2) — no string interpolation in SQL.
    await (tx as unknown as PrismaClient).$executeRawUnsafe(
      `UPDATE candidate_search_document SET fts_vector = to_tsvector('english', $1) WHERE candidate_id = $2::uuid`,
      ftsText,
      args.candidateId,
    );

    // Delete old embedding for this model/version, then insert new one via raw SQL
    await tx.embedding.deleteMany({
      where: {
        candidateId: args.candidateId,
        model: embeddingModel,
        version: embeddingVersion,
      },
    });

    // SAFETY: same cast pattern as above; all values parameterized ($1–$4).
    await (tx as unknown as PrismaClient).$executeRawUnsafe(
      `INSERT INTO embedding (id, candidate_id, embedding_model, embedding_version, embedding_vector, created_at)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4::vector(1536), NOW())`,
      args.candidateId,
      embeddingModel,
      embeddingVersion,
      vectorLiteral,
    );

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

  // If client supports $transaction we're at the top level — wrap in a tx.
  // Otherwise client is already a TransactionClient — use it directly.
  if (typeof (client as PrismaClient).$transaction === "function") {
    await (client as PrismaClient).$transaction(applyIndexUpdates);
  } else {
    await applyIndexUpdates(client as Prisma.TransactionClient);
  }

  return { ok: true, candidateId: args.candidateId, ftsCharCount: ftsText.length, embeddingModel };
}

export const __private = { buildFtsText, deterministicEmbeddingVector };

