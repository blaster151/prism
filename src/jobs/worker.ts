import { Worker } from "bullmq";
import http from "node:http";

import { QueueNames, createRedisConnection } from "./queues";

const port = Number.parseInt(process.env.PORT || "8080", 10);

export function startWorker() {
  const connection = createRedisConnection();

  const worker = new Worker(
    QueueNames.TestNoop,
    async (job) => {
      // no-op processor used for validating wiring
      if (
        (job.data as unknown as { shouldFail?: boolean })?.shouldFail === true &&
        job.attemptsMade < 2
      ) {
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

  return { worker, server };
}

