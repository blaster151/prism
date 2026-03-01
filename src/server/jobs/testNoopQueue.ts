import { Queue } from "bullmq";
import type { JobsOptions } from "bullmq";

import { QueueNames, createRedisConnection } from "@/jobs/queues";

declare global {
  // eslint-disable-next-line no-var
  var __prism_testNoopQueue: Queue | undefined;
}

export function getTestNoopQueueSingleton() {
  if (globalThis.__prism_testNoopQueue) return globalThis.__prism_testNoopQueue;

  const connection = createRedisConnection();
  const queue = new Queue(QueueNames.TestNoop, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  globalThis.__prism_testNoopQueue = queue;
  return queue;
}

export async function enqueueTestNoopJob(args: { shouldFail?: boolean }) {
  const queue = getTestNoopQueueSingleton();
  const opts: JobsOptions = {};
  const job = await queue.add("noop", { shouldFail: args.shouldFail === true }, opts);
  return { jobId: job.id };
}

export async function getTestNoopJobStatus(jobId: string) {
  const queue = getTestNoopQueueSingleton();
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const normalized =
    state === "completed"
      ? "succeeded"
      : state === "failed"
        ? "failed"
        : state === "active"
          ? "running"
          : "queued";

  return {
    id: job.id,
    state: normalized,
    rawState: state,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason ?? null,
  };
}

