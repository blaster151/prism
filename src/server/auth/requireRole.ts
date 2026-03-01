import type { Session } from "next-auth";

import { AppError } from "@/lib/errors";
import { UserRole, hasRequiredRole } from "./rbac";

export type SessionUser = NonNullable<Session["user"]>;

export function requireRole(args: {
  user: SessionUser | undefined;
  requiredRole: UserRole;
}) {
  const { user, requiredRole } = args;

  if (!user?.id) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to access this resource.",
      httpStatus: 401,
    });
  }

  if (!hasRequiredRole({ userRole: user.role, requiredRole })) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource.",
      httpStatus: 403,
      details: { requiredRole },
    });
  }
}

