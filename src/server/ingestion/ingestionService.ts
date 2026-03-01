import type { Session } from "next-auth";

import { AppError } from "@/lib/errors";
import { getIngestDropboxQueue } from "@/jobs/queues";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";

export type IngestionSource = "dropbox";

export type EnqueueDropboxIngestArgs = {
  session: Session | null;
  dropboxPath?: string;
};

export async function enqueueDropboxIngest(args: EnqueueDropboxIngestArgs) {
  requireRole({ user: args.session?.user, requiredRole: UserRole.POWER_USER });

  const actorUserId = args.session?.user?.id;
  if (!actorUserId) {
    // requireRole should prevent this, but keep it explicit for audit safety.
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to access this resource.",
      httpStatus: 401,
    });
  }

  const dropboxPath = args.dropboxPath ?? "";
  if (typeof dropboxPath !== "string") {
    throw new AppError({
      code: "BAD_REQUEST",
      message: "Invalid dropboxPath.",
      httpStatus: 400,
    });
  }

  const queue = getIngestDropboxQueue();
  const job = await queue.add("ingest-dropbox", { dropboxPath });

  await auditLog({
    actorUserId,
    eventType: AuditEventTypes.IngestionTrigger,
    entityType: "ingestion",
    entityId: String(job.id),
    metadata: { source: "dropbox", dropboxPath },
  });

  return { jobId: job.id };
}

