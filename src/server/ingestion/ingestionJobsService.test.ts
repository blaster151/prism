import { describe, expect, it, vi } from "vitest";

type MockJob = {
  id: string;
  name: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  getState: () => Promise<string>;
  retry: () => Promise<void>;
};

const job1 = vi.hoisted<MockJob>(() => ({
  id: "1",
  name: "ingest-dropbox",
  attemptsMade: 0,
  timestamp: 10,
  finishedOn: undefined,
  failedReason: undefined,
  getState: vi.fn(async () => "waiting"),
  retry: vi.fn(async () => undefined),
}));

const job2 = vi.hoisted<MockJob>(() => ({
  id: "2",
  name: "ingest-dropbox",
  attemptsMade: 2,
  timestamp: 20,
  finishedOn: 30,
  failedReason: "boom",
  getState: vi.fn(async () => "failed"),
  retry: vi.fn(async () => undefined),
}));

const getJobsMock = vi.hoisted(() => vi.fn(async () => [job1, job2]));
const getJobMock = vi.hoisted(() => vi.fn(async (id: string) => (id === "2" ? job2 : null)));

vi.mock("./ingestionQueue", () => ({
  getIngestDropboxQueueSingleton: () => ({
    getJobs: getJobsMock,
    getJob: getJobMock,
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

import {
  listRecentIngestionJobs,
  retryIngestionJob,
} from "./ingestionJobsService";

describe("ingestionJobsService", () => {
  it("lists recent jobs and normalizes states", async () => {
    const session = {
      user: { id: "u1", role: "POWER_USER" },
      expires: "2099-01-01T00:00:00.000Z",
    };
    const rows = await listRecentIngestionJobs({
      session: session as unknown as import("next-auth").Session,
      limit: 10,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe("2");
    expect(rows[0]?.state).toBe("failed");
    expect(rows[1]?.state).toBe("queued");
  });

  it("retries failed job and audit-logs", async () => {
    const session = {
      user: { id: "u1", role: "POWER_USER" },
      expires: "2099-01-01T00:00:00.000Z",
    };
    const res = await retryIngestionJob({
      session: session as unknown as import("next-auth").Session,
      jobId: "2",
    });
    expect(res.ok).toBe(true);
    expect(job2.retry).toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalled();
  });
});

