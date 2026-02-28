import { UserRole } from "@/server/auth/rbac";
import { requireRole, type SessionUser } from "@/server/auth/requireRole";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";

export async function adminPing(args: { user: SessionUser | undefined }) {
  requireRole({ user: args.user, requiredRole: UserRole.ADMIN });
  await auditLog({
    actorUserId: args.user?.id,
    eventType: AuditEventTypes.AdminAccess,
    metadata: {},
  });
  return { ok: true };
}

