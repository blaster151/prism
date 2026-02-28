import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { UserRole } from "@/server/auth/rbac";
import { requireRole } from "@/server/auth/requireRole";

describe("requireRole", () => {
  it("allows ADMIN when ADMIN required", () => {
    expect(() =>
      requireRole({
        user: { id: "u1", email: "a@example.com", role: UserRole.ADMIN },
        requiredRole: UserRole.ADMIN,
      }),
    ).not.toThrow();
  });

  it("denies POWER_USER when ADMIN required", () => {
    expect(() =>
      requireRole({
        user: { id: "u1", email: "p@example.com", role: UserRole.POWER_USER },
        requiredRole: UserRole.ADMIN,
      }),
    ).toThrow(AppError);
  });

  it("denies missing user as UNAUTHENTICATED", () => {
    try {
      requireRole({ user: undefined, requiredRole: UserRole.ADMIN });
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const e = err as AppError;
      expect(e.code).toBe("UNAUTHENTICATED");
      expect(e.httpStatus).toBe(401);
    }
  });
});

