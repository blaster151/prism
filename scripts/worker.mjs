import http from "node:http";

import IORedis from "ioredis";
import { Worker } from "bullmq";

const port = Number.parseInt(process.env.PORT || "8080", 10);
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("Missing required env var: REDIS_URL");
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const worker = new Worker(
  "test-noop",
  async (job) => {
    // Optional failure to validate retries/backoff.
    if (job.data?.shouldFail === true && job.attemptsMade < 2) {
      throw new Error("intentional failure for retry validation");
    }
    return { ok: true };
  },
  {
    connection,
    concurrency: 2,
  },
);

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("prism-worker\n");
});

server.listen(port, () => {
  console.log(`prism-worker listening on :${port}`);
});

worker.on("completed", (job) => {
  console.log(`job completed: ${job.id}`);
});
worker.on("failed", (job, err) => {
  console.log(`job failed: ${job?.id} ${err?.message ?? "unknown"}`);
});

