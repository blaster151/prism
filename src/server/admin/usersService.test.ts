import { describe, expect, it, vi } from "vitest";

import { UserRole } from "@/server/auth/rbac";
import { AppError } from "@/lib/errors";

import { listUsers, setUserRole } from "@/server/admin/usersService";

const auditLogMock = vi.fn(async () => ({ id: "ae1" }));

vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: auditLogMock,
}));

const tx = {
  user: {
    findUnique: vi.fn(async () => ({ role: UserRole.POWER_USER })),
    update: vi.fn(async () => ({ id: "u2", role: UserRole.ADMIN })),
  },
} as unknown;

const prismaMock = {
  user: {
    findMany: vi.fn(async () => [
      {
        id: "u1",
        email: "a@example.com",
        role: UserRole.ADMIN,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
  },
  $transaction: vi.fn(async (fn: unknown) =>
    (fn as (tx: unknown) => Promise<unknown>)(tx),
  ),
};

vi.mock("@/server/db/prisma", () => ({
  prisma: prismaMock,
}));

describe("usersService", () => {
  it("denies listUsers for POWER_USER", async () => {
    await expect(
      listUsers({
        user: { id: "u1", email: "p@example.com", role: UserRole.POWER_USER },
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("allows listUsers for ADMIN", async () => {
    await expect(
      listUsers({
        user: { id: "u1", email: "a@example.com", role: UserRole.ADMIN },
      }),
    ).resolves.toEqual({ users: expect.any(Array) });
  });

  it("writes audit event on role change", async () => {
    await expect(
      setUserRole({
        user: { id: "u1", email: "a@example.com", role: UserRole.ADMIN },
        targetUserId: "u2",
        role: UserRole.ADMIN,
      }),
    ).resolves.toEqual({ user: { id: "u2", role: UserRole.ADMIN } });

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "u1",
        eventType: expect.stringMatching(/admin\.user\.role_change/),
        entityType: "user",
        entityId: "u2",
        metadata: expect.objectContaining({
          fromRole: UserRole.POWER_USER,
          toRole: UserRole.ADMIN,
        }),
      }),
      expect.any(Object),
    );
  });
});

