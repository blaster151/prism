import { prisma } from "@/server/db/prisma";
import { UserRole } from "@/server/auth/rbac";
import { requireRole, type SessionUser } from "@/server/auth/requireRole";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";

import { CandidateLifecycleState } from "@prisma/client";

export async function listCandidates(args: {
  user: SessionUser | undefined;
  lifecycleState?: CandidateLifecycleState;
}) {
  requireRole({ user: args.user, requiredRole: UserRole.POWER_USER });

  const lifecycleState = args.lifecycleState ?? CandidateLifecycleState.ACTIVE;

  const candidates = await prisma.candidate.findMany({
    where: { lifecycleState },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      lifecycleState: true,
      canonicalPersonKey: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { resumeDocuments: true } },
    },
  });

  return { candidates };
}

export async function setCandidateLifecycle(args: {
  user: SessionUser | undefined;
  candidateId: string;
  lifecycleState: CandidateLifecycleState;
}) {
  requireRole({ user: args.user, requiredRole: UserRole.POWER_USER });

  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.candidate.findUnique({
      where: { id: args.candidateId },
      select: { lifecycleState: true },
    });

    const candidate = await tx.candidate.update({
      where: { id: args.candidateId },
      data: { lifecycleState: args.lifecycleState },
      select: { id: true, lifecycleState: true },
    });

    await auditLog(
      {
        actorUserId: args.user?.id,
        eventType: AuditEventTypes.CandidateLifecycleChange,
        entityType: "candidate",
        entityId: args.candidateId,
        metadata: {
          from: before?.lifecycleState ?? null,
          to: args.lifecycleState,
        },
      },
      { tx },
    );

    return candidate;
  });

  return { candidate: result };
}

