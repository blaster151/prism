"use client";

import { useState } from "react";
import Link from "next/link";

import type { SearchResult } from "@/server/search/types";
import { ExplanationPanel } from "@/components/ExplanationPanel";

export interface SearchResultCardProps {
  result: SearchResult;
  rank: number;
}

export function SearchResultCard({ result, rank }: SearchResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const pct = Math.round(result.score * 100);
  const semPct = Math.round(result.semanticScore * 100);
  const lexPct = Math.round(result.lexicalScore * 100);

  const hasExplanation =
    result.explanation != null && result.explanation.evidence.length > 0;

  return (
    <div className="rounded-md border border-black/10 dark:border-white/15 px-4 py-3 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-black/40 dark:text-white/40">
              #{rank}
            </span>
            <Link
              href={`/candidates/${result.candidateId}/record`}
              className="text-sm font-medium truncate hover:underline"
            >
              {result.candidateName ?? result.candidateId}
            </Link>
          </div>
          {result.explanation?.summary ? (
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">
              {result.explanation.summary}
            </div>
          ) : null}
          <div className="mt-1 text-xs text-black/50 dark:text-white/50">
            Semantic {semPct}% · Lexical {lexPct}%
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold tabular-nums">{pct}%</div>
          <div className="text-xs text-black/50 dark:text-white/50">match</div>
        </div>
      </div>

      {hasExplanation ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 transition-colors"
          >
            {expanded ? "▾ Hide evidence" : "▸ Show evidence"}
          </button>
          {expanded ? (
            <div className="mt-2 pl-2 border-l-2 border-black/10 dark:border-white/15">
              <ExplanationPanel explanation={result.explanation!} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
