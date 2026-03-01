import { Queue } from "bullmq";

import { QueueNames, createRedisConnectionOptions } from "@/jobs/queues";

declare global {
  var __prism_indexQueue: Queue | undefined;
}

export function getIndexQueueSingleton() {
  if (globalThis.__prism_indexQueue) return globalThis.__prism_indexQueue;

  const connection = createRedisConnectionOptions();
  const queue = new Queue(QueueNames.IndexCandidate, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: 200,
      removeOnFail: 200,
    },
  });

  globalThis.__prism_indexQueue = queue;
  return queue;
}

