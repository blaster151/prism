"use client";

import type { Explanation, EvidenceItem } from "@/server/search/types";

export interface ExplanationPanelProps {
  explanation: Explanation;
}

export function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  if (explanation.evidence.length === 0) {
    return (
      <div className="text-xs text-black/50 dark:text-white/50 italic">
        No specific evidence items available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-black/60 dark:text-white/60">
        Evidence
      </div>
      <div className="space-y-1.5">
        {explanation.evidence.map((item, i) => (
          <EvidenceRow key={`${item.field}-${item.source}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function EvidenceRow({ item }: { item: EvidenceItem }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${
          item.source === "record"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        }`}
      >
        {item.source === "record" ? "Record" : "Resume"}
      </span>
      <span className="font-medium text-black/70 dark:text-white/70 shrink-0">
        {item.field}
      </span>
      {item.snippet ? (
        <span className="text-black/50 dark:text-white/50 truncate">
          {item.snippet}
        </span>
      ) : null}
    </div>
  );
}
