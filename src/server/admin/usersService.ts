import { prisma } from "@/server/db/prisma";
import { UserRole } from "@/server/auth/rbac";
import { requireRole, type SessionUser } from "@/server/auth/requireRole";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";

export async function listUsers(args: { user: SessionUser | undefined }) {
  requireRole({ user: args.user, requiredRole: UserRole.ADMIN });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { users };
}

export async function setUserRole(args: {
  user: SessionUser | undefined;
  targetUserId: string;
  role: UserRole;
}) {
  requireRole({ user: args.user, requiredRole: UserRole.ADMIN });

  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: args.targetUserId },
      select: { role: true },
    });

    const user = await tx.user.update({
      where: { id: args.targetUserId },
      data: { role: args.role },
      select: { id: true, role: true },
    });

    await auditLog(
      {
        actorUserId: args.user?.id,
        eventType: AuditEventTypes.AdminUserRoleChange,
        entityType: "user",
        entityId: args.targetUserId,
        metadata: { fromRole: before?.role ?? null, toRole: args.role },
      },
      { tx },
    );

    return user;
  });

  return { user: updated };
}

