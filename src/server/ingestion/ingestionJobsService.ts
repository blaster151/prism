import type { Session } from "next-auth";

import { AppError } from "@/lib/errors";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";

import { getIngestDropboxQueueSingleton } from "./ingestionQueue";
import { type NormalizedJobState, normalizeJobState as normalizeState } from "@/lib/jobTypes";

export type { NormalizedJobState };

export type IngestionJobSummary = {
  id: string;
  state: NormalizedJobState;
  rawState: string;
  name: string;
  attemptsMade: number;
  timestamp: number;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
};

export async function getIngestionJob(args: {
  session: Session | null;
  jobId: string;
}): Promise<IngestionJobSummary | null> {
  requireRole({ user: args.session?.user, requiredRole: UserRole.POWER_USER });

  const queue = getIngestDropboxQueueSingleton();
  const job = await queue.getJob(args.jobId);
  if (!job) return null;

  const rawState = await job.getState();
  return {
    id: String(job.id),
    name: job.name,
    state: normalizeState(rawState),
    rawState,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn ?? null,
    finishedOn: job.finishedOn ?? null,
    failedReason: job.failedReason ?? null,
  };
}

export async function listRecentIngestionJobs(args: {
  session: Session | null;
  limit?: number;
}): Promise<IngestionJobSummary[]> {
  requireRole({ user: args.session?.user, requiredRole: UserRole.POWER_USER });

  const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
  const queue = getIngestDropboxQueueSingleton();

  const jobs = await queue.getJobs(
    ["active", "waiting", "delayed", "completed", "failed"],
    0,
    limit - 1,
    true,
  );

  const rows: IngestionJobSummary[] = [];
  for (const job of jobs) {
    const rawState = await job.getState();
    rows.push({
      id: String(job.id),
      name: job.name,
      state: normalizeState(rawState),
      rawState,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn ?? null,
      finishedOn: job.finishedOn ?? null,
      failedReason: job.failedReason ?? null,
    });
  }

  // Most recent first
  rows.sort((a, b) => b.timestamp - a.timestamp);
  return rows;
}

export async function retryIngestionJob(args: {
  session: Session | null;
  jobId: string;
}) {
  requireRole({ user: args.session?.user, requiredRole: UserRole.POWER_USER });

  const actorUserId = args.session?.user?.id;
  if (!actorUserId) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to access this resource.",
      httpStatus: 401,
    });
  }

  const queue = getIngestDropboxQueueSingleton();
  const job = await queue.getJob(args.jobId);
  if (!job) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Job not found.",
      httpStatus: 404,
    });
  }

  const rawState = await job.getState();
  if (rawState !== "failed") {
    throw new AppError({
      code: "CONFLICT",
      message: "Only failed jobs can be retried.",
      httpStatus: 409,
      details: { rawState },
    });
  }

  await job.retry();

  await auditLog({
    actorUserId,
    eventType: AuditEventTypes.IngestionRetry,
    entityType: "ingestion",
    entityId: String(job.id),
    metadata: { action: "retry" },
  });

  return { ok: true };
}

