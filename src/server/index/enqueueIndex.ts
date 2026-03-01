import { getIndexQueueSingleton } from "./indexQueue";

function isDuplicateJobError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (msg.includes("Job") && lower.includes("exists")) || lower.includes("job already exists");
}

export async function enqueueCandidateIndex(args: { candidateId: string }) {
  try {
    const queue = getIndexQueueSingleton();
    const job = await queue.add(
      "index",
      { candidateId: args.candidateId },
      { jobId: args.candidateId },
    );
    return { jobId: job.id, enqueued: true };
  } catch (err) {
    // Best-effort enqueue. Do not block writes if the queue isn't configured.
    if (isDuplicateJobError(err)) return { jobId: args.candidateId, enqueued: false };
    return { jobId: args.candidateId, enqueued: false };
  }
}

