import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors";
import { UserRole } from "@/server/auth/rbac";
import { adminPing } from "@/server/admin/adminService";

vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: vi.fn(async () => ({ id: "ae1" })),
}));

describe("adminPing", () => {
  it("returns ok for ADMIN", () => {
    expect(
      adminPing({
        user: { id: "u1", email: "a@example.com", role: UserRole.ADMIN },
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("throws FORBIDDEN for POWER_USER", () => {
    expect(
      adminPing({
        user: { id: "u1", email: "p@example.com", role: UserRole.POWER_USER },
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

