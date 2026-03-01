import type { Session } from "next-auth";

import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";

import { getExtractQueueSingleton } from "./extractQueue";
import { type NormalizedJobState, normalizeJobState as normalizeState } from "@/lib/jobTypes";

export type { NormalizedJobState };

export async function getExtractJobStatus(args: {
  session: Session | null;
  jobId: string;
}) {
  requireRole({ user: args.session?.user, requiredRole: UserRole.POWER_USER });

  const queue = getExtractQueueSingleton();
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

