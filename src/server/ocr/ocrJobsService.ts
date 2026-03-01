import type { Session } from "next-auth";

import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";

import { getOcrQueueSingleton } from "./ocrQueue";

export type NormalizedJobState = "queued" | "running" | "succeeded" | "failed";

function normalizeState(state: string): NormalizedJobState {
  if (state === "completed") return "succeeded";
  if (state === "failed") return "failed";
  if (state === "active") return "running";
  return "queued";
}

export async function getOcrJobStatus(args: {
  session: Session | null;
  jobId: string;
}) {
  requireRole({ user: args.session?.user, requiredRole: UserRole.POWER_USER });

  const queue = getOcrQueueSingleton();
  const job = await queue.getJob(args.jobId);
  if (!job) return null;
  const rawState = await job.getState();
  return {
    id: String(job.id),
    state: normalizeState(rawState),
    rawState,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason ?? null,
  };
}

