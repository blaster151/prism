// ---------------------------------------------------------------------------
// Shared type contracts for the search module.
// Used by hybridSearch, route handler, and (later) UI components.
// ---------------------------------------------------------------------------

/**
 * Evidence item grounding an explanation in a concrete DataRecord field
 * or resume text span. Every item MUST reference data that actually exists.
 */
export interface EvidenceItem {
  field: string;                // DataRecord field name (e.g., "skills", "clearance")
  snippet?: string;             // highlighted text from resume/record
  source: "record" | "resume";
  sourceDocumentId?: string;    // resume document ID when source is "resume"
}

/**
 * Explanation for why a candidate matched a search query.
 * Must be grounded — the system never claims evidence it cannot point to.
 */
export interface Explanation {
  summary: string;              // 1–2 sentence "why matched"
  evidence: EvidenceItem[];
}

/**
 * A single ranked search result.
 * `explanation` is populated by explainService (Story 4.5).
 */
export interface SearchResult {
  candidateId: string;
  candidateName: string | null;
  score: number;            // 0–1 combined relevance
  semanticScore: number;    // pgvector cosine similarity component (0–1)
  lexicalScore: number;     // FTS rank component (0–1 normalized)
  explanation?: Explanation; // populated by explainService; absent if not generated
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
