import { Queue } from "bullmq";

import { QueueNames, createRedisConnectionOptions } from "@/jobs/queues";

declare global {
  var __prism_ocrQueue: Queue | undefined;
}

export function getOcrQueueSingleton() {
  if (globalThis.__prism_ocrQueue) return globalThis.__prism_ocrQueue;

  const connection = createRedisConnectionOptions();
  const queue = new Queue(QueueNames.OcrResume, {
    connection,
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 200,
      removeOnFail: 200,
    },
  });

  globalThis.__prism_ocrQueue = queue;
  return queue;
}

