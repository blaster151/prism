import { Queue } from "bullmq";
import IORedis from "ioredis";

export const QueueNames = {
  TestNoop: "test-noop",
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

export function createRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("Missing required env var: REDIS_URL");
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null,
  });
}

export function getTestNoopQueue() {
  const connection = createRedisConnection();
  return new Queue(QueueNames.TestNoop, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });
}

