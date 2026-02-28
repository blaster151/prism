import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { UserRole } from "@/server/auth/rbac";
import { adminPing } from "@/server/admin/adminService";

describe("adminPing", () => {
  it("returns ok for ADMIN", () => {
    expect(
      adminPing({
        user: { id: "u1", email: "a@example.com", role: UserRole.ADMIN },
      }),
    ).toEqual({ ok: true });
  });

  it("throws FORBIDDEN for POWER_USER", () => {
    expect(() =>
      adminPing({
        user: { id: "u1", email: "p@example.com", role: UserRole.POWER_USER },
      }),
    ).toThrow(AppError);
  });
});

