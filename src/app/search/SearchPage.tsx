"use client";

import { useCallback, useState } from "react";

import type { SearchResult } from "@/server/search/types";
import { SearchBar } from "@/components/SearchBar";
import { SearchResultCard } from "@/components/SearchResultCard";

export function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queryContext, setQueryContext] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      try {
        const body: Record<string, unknown> = { query };
        if (sessionId) body.sessionId = sessionId;

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `Search failed (${res.status}).`);
          setResults([]);
        } else {
          setResults(json.data.results);
          if (json.data.sessionId) setSessionId(json.data.sessionId);
          if (json.data.queryContext) setQueryContext(json.data.queryContext);
        }
      } catch {
        setError("Search request failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId],
  );

  const handleNewSearch = useCallback(() => {
    setSessionId(null);
    setQueryContext(null);
    setResults([]);
    setHasSearched(false);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {queryContext && sessionId ? (
        <div className="flex items-start justify-between gap-4 rounded-md border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-black/50 dark:text-white/50 mb-1">
              Search context
            </div>
            <div className="text-sm text-black/70 dark:text-white/70">
              {queryContext}
            </div>
          </div>
          <button
            type="button"
            onClick={handleNewSearch}
            className="shrink-0 rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
          >
            New Search
          </button>
        </div>
      ) : null}

      <SearchBar onSearch={handleSearch} disabled={loading} />

      {error ? (
        <div className="rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-black/60 dark:text-white/60">
          Searching…
        </div>
      ) : hasSearched && results.length === 0 && !error ? (
        <div className="text-sm text-black/60 dark:text-white/60">
          No results found. Try a different query.
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs text-black/50 dark:text-white/50">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
          {results.map((r, i) => (
            <SearchResultCard key={r.candidateId} result={r} rank={i + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
