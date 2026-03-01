import { describe, expect, it } from "vitest";

import { UserRole, isAdmin, hasRequiredRole } from "@/server/auth/rbac";

describe("isAdmin", () => {
  it("returns true for ADMIN", () => {
    expect(isAdmin(UserRole.ADMIN)).toBe(true);
  });

  it("returns false for POWER_USER", () => {
    expect(isAdmin(UserRole.POWER_USER)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAdmin(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe("hasRequiredRole", () => {
  it("returns true when role matches exactly (ADMIN === ADMIN)", () => {
    expect(
      hasRequiredRole({ userRole: UserRole.ADMIN, requiredRole: UserRole.ADMIN }),
    ).toBe(true);
  });

  it("returns true when role matches exactly (POWER_USER === POWER_USER)", () => {
    expect(
      hasRequiredRole({ userRole: UserRole.POWER_USER, requiredRole: UserRole.POWER_USER }),
    ).toBe(true);
  });

  it("ADMIN satisfies POWER_USER requirement (superset)", () => {
    expect(
      hasRequiredRole({ userRole: UserRole.ADMIN, requiredRole: UserRole.POWER_USER }),
    ).toBe(true);
  });

  it("POWER_USER does NOT satisfy ADMIN requirement", () => {
    expect(
      hasRequiredRole({ userRole: UserRole.POWER_USER, requiredRole: UserRole.ADMIN }),
    ).toBe(false);
  });

  it("returns false when userRole is undefined", () => {
    expect(
      hasRequiredRole({ userRole: undefined, requiredRole: UserRole.ADMIN }),
    ).toBe(false);
  });

  it("returns false when userRole is null", () => {
    expect(
      hasRequiredRole({ userRole: null, requiredRole: UserRole.ADMIN }),
    ).toBe(false);
  });
});
