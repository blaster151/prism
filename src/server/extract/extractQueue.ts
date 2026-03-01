import { Queue } from "bullmq";

import { QueueNames, createRedisConnectionOptions } from "@/jobs/queues";

declare global {
  var __prism_extractQueue: Queue | undefined;
}

export function getExtractQueueSingleton() {
  if (globalThis.__prism_extractQueue) return globalThis.__prism_extractQueue;

  const connection = createRedisConnectionOptions();
  const queue = new Queue(QueueNames.ExtractResume, {
    connection,
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: 200,
      removeOnFail: 200,
    },
  });

  globalThis.__prism_extractQueue = queue;
  return queue;
}

