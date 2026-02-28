"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CandidateLifecycleState } from "@prisma/client";

type CandidateRow = {
  id: string;
  lifecycleState: CandidateLifecycleState;
  canonicalPersonKey: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { resumeDocuments: number };
};

export function CandidateList() {
  const [state, setState] = useState<CandidateLifecycleState>(
    CandidateLifecycleState.ACTIVE,
  );
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = useMemo(
    () => (state === CandidateLifecycleState.ACTIVE ? "Active" : "Archive"),
    [state],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates?state=${state}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to load candidates.");
        setRows([]);
      } else {
        setRows(json.data.candidates);
      }
    } catch {
      setError("Failed to load candidates.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleLifecycle(row: CandidateRow) {
    const next =
      row.lifecycleState === CandidateLifecycleState.ACTIVE
        ? CandidateLifecycleState.ARCHIVE
        : CandidateLifecycleState.ACTIVE;

    const res = await fetch(`/api/candidates/${row.id}/lifecycle`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lifecycleState: next }),
    });
    if (!res.ok) {
      setError("Failed to update lifecycle.");
      return;
    }
    await load();
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-4 border-b border-black/10 dark:border-white/15">
        <div>
          <div className="text-sm font-medium">Candidates</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            Showing: {label}
          </div>
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value as CandidateLifecycleState)}
          className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1 text-sm"
        >
          <option value={CandidateLifecycleState.ACTIVE}>Active</option>
          <option value={CandidateLifecycleState.ARCHIVE}>Archive</option>
        </select>
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}

      <div className="p-4">
        {loading ? (
          <div className="text-sm text-black/60 dark:text-white/60">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-black/60 dark:text-white/60">
            No candidates.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-md border border-black/10 dark:border-white/15 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.canonicalPersonKey ?? r.id}
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/60">
                    {r.lifecycleState} • {r._count.resumeDocuments} docs
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleLifecycle(r)}
                  className="text-sm underline underline-offset-4"
                >
                  {r.lifecycleState === CandidateLifecycleState.ACTIVE
                    ? "Archive"
                    : "Restore"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

