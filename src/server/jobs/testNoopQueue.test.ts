import { describe, expect, it, vi } from "vitest";

const addMock = vi.fn(async () => ({ id: "job-1" }));
const getJobMock = vi.fn(async () => ({
  id: "job-1",
  attemptsMade: 1,
  failedReason: null,
  getState: vi.fn(async () => "completed"),
}));

vi.mock("bullmq", () => ({
  Queue: class {
    add = addMock;
    getJob = getJobMock;
    constructor() {}
  },
}));

vi.mock("@/jobs/queues", () => ({
  QueueNames: { TestNoop: "test-noop" },
  createRedisConnection: vi.fn(() => ({})),
}));

import { enqueueTestNoopJob, getTestNoopJobStatus } from "./testNoopQueue";

describe("testNoopQueue", () => {
  it("enqueues test job and returns id", async () => {
    const res = await enqueueTestNoopJob({ shouldFail: false });
    expect(res.jobId).toBe("job-1");
    expect(addMock).toHaveBeenCalled();
  });

  it("maps job status to succeeded", async () => {
    const status = await getTestNoopJobStatus("job-1");
    expect(status?.state).toBe("succeeded");
  });
});

