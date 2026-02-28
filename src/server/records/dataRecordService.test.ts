import { describe, expect, it, vi } from "vitest";

import { UserRole } from "@prisma/client";

vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: vi.fn(async () => ({ id: "ae1" })),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: unknown) =>
      (fn as (tx: unknown) => Promise<unknown>)({
        dataRecord: {
          findUnique: vi.fn(async () => ({ id: "r1", fields: { fullName: "Old" } })),
          create: vi.fn(),
          update: vi.fn(async () => ({ id: "r1", fields: { fullName: "New" } })),
        },
        dataRecordFieldProvenance: {
          findFirst: vi.fn(async () => null),
          create: vi.fn(async () => ({ id: "p1" })),
          update: vi.fn(async () => ({ id: "p1" })),
        },
        dataRecordVersion: {
          aggregate: vi.fn(async () => ({ _max: { versionNumber: 1 } })),
          create: vi.fn(async () => ({ id: "v2" })),
        },
        auditEvent: { create: vi.fn(async () => ({ id: "ae1" })) },
      }),
    ),
  },
}));

import { updateCandidateRecord } from "./dataRecordService";

describe("updateCandidateRecord", () => {
  it("sets provenance to USER_EDITED and increments version", async () => {
    const res = await updateCandidateRecord({
      user: { id: "u1", email: "p@example.com", role: UserRole.POWER_USER },
      candidateId: "c1",
      patch: { fullName: "New" },
    });

    expect(res.recordId).toBe("r1");
    expect(res.version).toBe(2);
    expect(res.changedFields).toEqual(["fullName"]);
  });

  it("writes audit event for edit", async () => {
    await updateCandidateRecord({
      user: { id: "u1", email: "p@example.com", role: UserRole.POWER_USER },
      candidateId: "c1",
      patch: { email: "x@example.com" },
    });

    const { auditLog } = await import("@/server/audit/auditLogger");
    expect(auditLog).toHaveBeenCalled();
  });
});

