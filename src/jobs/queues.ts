import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";

export const QueueNames = {
  TestNoop: "test-noop",
  IngestDropbox: "ingest-dropbox",
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

export function createRedisConnectionOptions(): ConnectionOptions {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("Missing required env var: REDIS_URL");
  }

  const u = new URL(url);
  const port = u.port ? Number.parseInt(u.port, 10) : 6379;
  const db =
    u.pathname && u.pathname !== "/"
      ? Number.parseInt(u.pathname.replace("/", ""), 10)
      : undefined;

  return {
    host: u.hostname,
    port,
    username: u.username || undefined,
    password: u.password || undefined,
    db: Number.isFinite(db as number) ? (db as number) : undefined,
    maxRetriesPerRequest: null,
  };
}

export function getTestNoopQueue() {
  const connection = createRedisConnectionOptions();
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

export function getIngestDropboxQueue() {
  const connection = createRedisConnectionOptions();
  return new Queue(QueueNames.IngestDropbox, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 200,
      removeOnFail: 200,
    },
  });
}

