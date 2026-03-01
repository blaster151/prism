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

const appBaseUrl = process.env.PRISM_APP_INTERNAL_URL || "http://127.0.0.1:3000";
const internalToken = process.env.PRISM_INTERNAL_WORKER_TOKEN;

async function postJson(path, body) {
  if (!internalToken) {
    throw new Error("Missing required env var: PRISM_INTERNAL_WORKER_TOKEN");
  }
  const res = await fetch(`${appBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-prism-internal-token": internalToken,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || "internal request failed");
  }
  return json?.data;
}

const ocrWorker = new Worker(
  "ocr-resume",
  async (job) => {
    const { resumeDocumentId, pdfBase64 } = job.data || {};
    if (!resumeDocumentId || !pdfBase64) {
      throw new Error("missing resumeDocumentId/pdfBase64");
    }
    return await postJson("/api/internal/ocr/run", { resumeDocumentId, pdfBase64 });
  },
  { connection, concurrency: 1 },
);

const extractWorker = new Worker(
  "extract-resume",
  async (job) => {
    const { resumeDocumentId } = job.data || {};
    if (!resumeDocumentId) {
      throw new Error("missing resumeDocumentId");
    }
    return await postJson("/api/internal/extract/run", { resumeDocumentId });
  },
  { connection, concurrency: 1 },
);

const indexWorker = new Worker(
  "index-candidate",
  async (job) => {
    const { candidateId } = job.data || {};
    if (!candidateId) {
      throw new Error("missing candidateId");
    }
    return await postJson("/api/internal/index/run", { candidateId });
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

worker.on("completed", (job) => {
  console.log(`job completed: ${job.id}`);
});
worker.on("failed", (job, err) => {
  console.log(`job failed: ${job?.id} ${err?.message ?? "unknown"}`);
});

ocrWorker.on("completed", (job) => {
  console.log(`job completed: ${job.id}`);
});
ocrWorker.on("failed", (job, err) => {
  console.log(`job failed: ${job?.id} ${err?.message ?? "unknown"}`);
});

extractWorker.on("completed", (job) => {
  console.log(`job completed: ${job.id}`);
});
extractWorker.on("failed", (job, err) => {
  console.log(`job failed: ${job?.id} ${err?.message ?? "unknown"}`);
});

indexWorker.on("completed", (job) => {
  console.log(`job completed: ${job.id}`);
});
indexWorker.on("failed", (job, err) => {
  console.log(`job failed: ${job?.id} ${err?.message ?? "unknown"}`);
});

