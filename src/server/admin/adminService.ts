import { UserRole } from "@/server/auth/rbac";
import { requireRole, type SessionUser } from "@/server/auth/requireRole";

export function adminPing(args: { user: SessionUser | undefined }) {
  requireRole({ user: args.user, requiredRole: UserRole.ADMIN });
  return { ok: true };
}

