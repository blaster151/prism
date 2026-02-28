import { describe, expect, it, vi } from "vitest";

import { auditLog } from "@/server/audit/auditLogger";

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    auditEvent: {
      create: vi.fn(async () => ({ id: "ae1" })),
    },
  },
}));

describe("auditLog", () => {
  it("writes audit_event with defaults", async () => {
    const res = await auditLog({
      actorUserId: "u1",
      eventType: "auth.sign_in",
      metadata: { provider: "credentials" },
    });

    expect(res).toEqual({ id: "ae1" });
    const { prisma } = await import("@/server/db/prisma");
    expect((prisma.auditEvent.create as any)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: "u1",
          eventType: "auth.sign_in",
          metadata: { provider: "credentials" },
        }),
        select: { id: true },
      }),
    );
  });
});

