// ---------------------------------------------------------------------------
// Shared type contracts for the search module.
// Used by hybridSearch, route handler, and (later) UI components.
// ---------------------------------------------------------------------------

/**
 * A single ranked search result.
 * `explanation` is a stub in Story 4.3 — populated by explainService in Story 4.5.
 */
export interface SearchResult {
  candidateId: string;
  candidateName: string | null;
  score: number;            // 0–1 combined relevance
  semanticScore: number;    // pgvector cosine similarity component (0–1)
  lexicalScore: number;     // FTS rank component (0–1 normalized)
}

export interface SearchFilters {
  lifecycleState?: "ACTIVE" | "ARCHIVE";
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;           // 1–100, default 20
}

export interface SearchResponse {
  results: SearchResult[];
  resultCount: number;
}
