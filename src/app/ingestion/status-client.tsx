"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Job = {
  id: string;
  state: "queued" | "running" | "succeeded" | "failed";
  rawState: string;
  name: string;
  attemptsMade: number;
  timestamp: number;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
};

function formatTime(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function getErrorMessage(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const err = (json as { error?: unknown }).error;
  if (!err || typeof err !== "object") return null;
  const msg = (err as { message?: unknown }).message;
  return typeof msg === "string" ? msg : null;
}

async function apiJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = getErrorMessage(json) ?? "Request failed.";
    throw new Error(msg);
  }
  return json as T;
}

export function IngestionStatusClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [triggerPath, setTriggerPath] = useState("");
  const [triggerFail, setTriggerFail] = useState<string | null>(null);

  const canRetry = useMemo(() => new Set(jobs.filter((j) => j.state === "failed").map((j) => j.id)), [jobs]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ data: { jobs: Job[] } }>("/api/ingestion/jobs?limit=25", {
        cache: "no-store",
      });
      setJobs(res.data.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function triggerIngestion() {
    setTriggerFail(null);
    try {
      await apiJson<{ data: { jobId: string } }>("/api/ingestion/trigger", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dropboxPath: triggerPath || undefined }),
      });
      await refresh();
    } catch (e) {
      setTriggerFail(e instanceof Error ? e.message : "Failed to trigger ingestion.");
    }
  }

  async function retry(jobId: string) {
    setError(null);
    try {
      await apiJson<{ data: { ok: true } }>(`/api/ingestion/jobs/${jobId}/retry`, {
        method: "POST",
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to retry job.");
    }
  }

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <section className="rounded-md border border-neutral-200 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[260px] flex-1">
          <label className="text-sm font-medium">Dropbox path (optional)</label>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            placeholder="e.g. /resumes"
            value={triggerPath}
            onChange={(e) => setTriggerPath(e.target.value)}
          />
          {triggerFail ? <div className="mt-2 text-sm text-red-600">{triggerFail}</div> : null}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={triggerIngestion}
            disabled={isLoading}
          >
            Trigger ingestion
          </button>
          <button
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
            onClick={refresh}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
              <th className="py-2 pr-3">Job ID</th>
              <th className="py-2 pr-3">State</th>
              <th className="py-2 pr-3">Attempts</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3">Finished</th>
              <th className="py-2 pr-3">Error</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td className="py-3 text-neutral-500" colSpan={7}>
                  No jobs found.
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-3 font-mono text-xs">{j.id}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        j.state === "failed"
                          ? "text-red-700"
                          : j.state === "succeeded"
                            ? "text-green-700"
                            : j.state === "running"
                              ? "text-blue-700"
                              : "text-neutral-700"
                      }
                    >
                      {j.state}
                    </span>
                    <span className="ml-2 text-xs text-neutral-400">({j.rawState})</span>
                  </td>
                  <td className="py-2 pr-3">{j.attemptsMade}</td>
                  <td className="py-2 pr-3">{formatTime(j.timestamp)}</td>
                  <td className="py-2 pr-3">{formatTime(j.finishedOn)}</td>
                  <td className="py-2 pr-3 text-neutral-600">{j.failedReason ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <button
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
                      onClick={() => retry(j.id)}
                      disabled={!canRetry.has(j.id)}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

