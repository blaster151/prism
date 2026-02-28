import { describe, expect, it, vi } from "vitest";

import { CandidateLifecycleState, UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors";

vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: vi.fn(async () => ({ id: "ae1" })),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    candidate: {
      findMany: vi.fn(async () => [
        {
          id: "c1",
          lifecycleState: CandidateLifecycleState.ACTIVE,
          canonicalPersonKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { resumeDocuments: 0 },
        },
      ]),
      findUnique: vi.fn(async () => ({ lifecycleState: CandidateLifecycleState.ACTIVE })),
      update: vi.fn(async () => ({ id: "c1", lifecycleState: CandidateLifecycleState.ARCHIVE })),
    },
    $transaction: vi.fn(async (fn: unknown) =>
      (fn as (tx: any) => Promise<unknown>)({
        candidate: {
          findUnique: vi.fn(async () => ({ lifecycleState: CandidateLifecycleState.ACTIVE })),
          update: vi.fn(async () => ({ id: "c1", lifecycleState: CandidateLifecycleState.ARCHIVE })),
        },
        auditEvent: { create: vi.fn(async () => ({ id: "ae1" })) },
      }),
    ),
  },
}));

import { listCandidates, setCandidateLifecycle } from "./candidatesService";

describe("candidatesService", () => {
  it("defaults list to ACTIVE", async () => {
    const res = await listCandidates({
      user: { id: "u1", email: "p@example.com", role: UserRole.POWER_USER },
    });
    expect(res.candidates).toHaveLength(1);
  });

  it("denies lifecycle update when unauthenticated", async () => {
    await expect(
      setCandidateLifecycle({
        user: undefined,
        candidateId: "c1",
        lifecycleState: CandidateLifecycleState.ARCHIVE,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

