import { describe, expect, it, vi } from "vitest";

import { auditLog } from "@/server/audit/auditLogger";

const createMock = vi.fn(async () => ({ id: "ae1" }));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    auditEvent: {
      create: createMock,
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
    expect(createMock).toHaveBeenCalledWith(
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

