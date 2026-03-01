import { Queue } from "bullmq";

import { QueueNames, createRedisConnectionOptions } from "@/jobs/queues";

declare global {
  var __prism_ingestDropboxQueue: Queue | undefined;
}

export function getIngestDropboxQueueSingleton() {
  if (globalThis.__prism_ingestDropboxQueue) return globalThis.__prism_ingestDropboxQueue;

  const connection = createRedisConnectionOptions();
  const queue = new Queue(QueueNames.IngestDropbox, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 200,
      removeOnFail: 200,
    },
  });

  globalThis.__prism_ingestDropboxQueue = queue;
  return queue;
}

