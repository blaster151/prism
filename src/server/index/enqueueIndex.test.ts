import { describe, expect, it, vi } from "vitest";

const addMock = vi.hoisted(() => vi.fn(async () => ({ id: "job1" })));

vi.mock("./indexQueue", () => ({
  getIndexQueueSingleton: () => ({
    add: addMock,
  }),
}));

import { enqueueCandidateIndex } from "./enqueueIndex";

describe("enqueueCandidateIndex", () => {
  it("enqueues with deterministic job id", async () => {
    const res = await enqueueCandidateIndex({ candidateId: "c1" });
    expect(res.enqueued).toBe(true);
    expect(addMock).toHaveBeenCalledWith(
      "index",
      { candidateId: "c1" },
      expect.objectContaining({ jobId: "c1" }),
    );
  });
});

