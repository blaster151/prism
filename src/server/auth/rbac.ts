import { UserRole } from "@prisma/client";

export { UserRole };

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === UserRole.ADMIN;
}

export function hasRequiredRole(args: {
  userRole: UserRole | undefined | null;
  requiredRole: UserRole;
}): boolean {
  const { userRole, requiredRole } = args;
  if (!userRole) return false;
  if (userRole === requiredRole) return true;
  // ADMIN implicitly satisfies POWER_USER requirement (superset role).
  if (requiredRole === UserRole.POWER_USER && userRole === UserRole.ADMIN) return true;
  return false;
}

