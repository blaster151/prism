import { describe, expect, it, vi } from "vitest";

const addMock = vi.hoisted(() => vi.fn(async () => ({ id: "job-123" })));

vi.mock("./ingestionQueue", () => ({
  getIngestDropboxQueueSingleton: () => ({
    add: addMock,
  }),
}));

const auditLogMock = vi.hoisted(() => vi.fn(async () => ({ id: "ae_1" })));
vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: auditLogMock,
}));

const requireRoleMock = vi.hoisted(() => vi.fn(() => undefined));
vi.mock("@/server/auth/requireRole", () => ({
  requireRole: requireRoleMock,
}));

import { enqueueDropboxIngest } from "./ingestionService";

describe("ingestionService", () => {
  it("enqueues an ingestion job and returns jobId", async () => {
    const session = {
      user: { id: "u1", role: "POWER_USER" },
      expires: "2099-01-01T00:00:00.000Z",
    };

    const res = await enqueueDropboxIngest({
      session: session as unknown as import("next-auth").Session,
      dropboxPath: "/incoming",
    });

    expect(res.jobId).toBe("job-123");
    expect(addMock).toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalled();
    expect(requireRoleMock).toHaveBeenCalled();
  });
});

