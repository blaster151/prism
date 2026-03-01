import { Worker } from "bullmq";
import http from "node:http";

import { QueueNames, createRedisConnectionOptions } from "./queues";
import { runOcrForResumeDocument } from "@/server/ocr/ocrService";
import { prisma } from "@/server/db/prisma";

const port = Number.parseInt(process.env.PORT || "8080", 10);

export function startWorker() {
  const connection = createRedisConnectionOptions();

  const testWorker = new Worker(
    QueueNames.TestNoop,
    async (job) => {
      if (
        (job.data as unknown as { shouldFail?: boolean })?.shouldFail === true &&
        job.attemptsMade < 2
      ) {
        throw new Error("intentional failure for retry validation");
      }
      return { ok: true };
    },
    { connection, concurrency: 2 },
  );

  const ingestWorker = new Worker(
    QueueNames.IngestDropbox,
    async () => {
      // Placeholder processor: real ingestion pipeline comes in later Epic 3 stories.
      return { ok: true };
    },
    { connection, concurrency: 1 },
  );

  const ocrWorker = new Worker(
    QueueNames.OcrResume,
    async (job) => {
      const data = job.data as unknown as {
        resumeDocumentId: string;
        pdfBase64: string;
      };
      // Job is internal; session is not available in worker context.
      return await runOcrForResumeDocument({
        session: null,
        resumeDocumentId: data.resumeDocumentId,
        pdfBase64: data.pdfBase64,
        opts: { tx: prisma },
      });
    },
    { connection, concurrency: 1 },
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

  for (const w of [testWorker, ingestWorker, ocrWorker]) {
    w.on("completed", (job) => {
      console.log(`job completed: ${job.id}`);
    });
    w.on("failed", (job, err) => {
      console.log(`job failed: ${job?.id} ${err?.message ?? "unknown"}`);
    });
  }

  return { workers: [testWorker, ingestWorker, ocrWorker], server };
}

