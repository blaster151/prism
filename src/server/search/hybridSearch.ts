import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { getEmbedProvider } from "@/server/search/embedProvider";
import type { SearchFilters, SearchResult } from "@/server/search/types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SEMANTIC_WEIGHT = 0.7;
const LEXICAL_WEIGHT = 0.3;

// ---------------------------------------------------------------------------
// Types for raw query results
// ---------------------------------------------------------------------------

interface RawSearchRow {
  candidate_id: string;
  candidate_name: string | null;
  semantic_score: number;
  lexical_score: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Hybrid search combining pgvector cosine similarity with Postgres FTS.
 *
 * 1. Embeds the query via the configured EmbedProvider.
 * 2. Runs a single raw SQL query that:
 *    - Computes cosine similarity on embedding.embedding_vector
 *    - Computes ts_rank on candidate_search_document.fts_vector
 *    - Joins candidate (lifecycle filter) + data_record (candidate name)
 *    - Orders by weighted combined score
 * 3. Returns normalized, ranked SearchResult[].
 */
export async function hybridSearch(args: {
  query: string;
  filters?: SearchFilters;
  limit?: number;
}): Promise<{ results: SearchResult[] }> {
  const limit = Math.min(Math.max(args.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const lifecycleState = args.filters?.lifecycleState ?? "ACTIVE";

  // Embed the query text (async — may be HTTP for real providers)
  const provider = getEmbedProvider();
  const queryVector = await provider.embed(args.query);
  // SAFE: queryVecLiteral is numeric-only, always passed as a bind parameter.
  const queryVecLiteral = `[${queryVector.join(",")}]`;

  // ---------------------------------------------------------------------------
  // The hybrid query:
  //
  // Semantic score: 1 - (embedding_vector <=> $queryVec) → cosine similarity [0, 1]
  //   pgvector <=> returns cosine distance (0 = identical, 2 = opposite).
  //   For normalized text embeddings, similarity is typically in [0, 1].
  //
  // Lexical score: ts_rank(fts_vector, plainto_tsquery('english', $query))
  //   ts_rank returns an unbounded float. We normalize later using the max.
  //
  // Combined: semantic_weight * semantic + lexical_weight * lexical_normalized
  // ---------------------------------------------------------------------------

  const rows = await (prisma as unknown as PrismaClient).$queryRawUnsafe<RawSearchRow[]>(
    `
    WITH semantic AS (
      SELECT DISTINCT ON (e.candidate_id)
        e.candidate_id,
        GREATEST(1.0 - (e.embedding_vector <=> $1::vector(1536)), 0) AS semantic_score
      FROM embedding e
      INNER JOIN candidate c ON c.id = e.candidate_id
      WHERE c.lifecycle_state = $2::"CandidateLifecycleState"
      ORDER BY e.candidate_id, (e.embedding_vector <=> $1::vector(1536)) ASC
    ),
    lexical AS (
      SELECT
        csd.candidate_id,
        ts_rank(csd.fts_vector, plainto_tsquery('english', $3)) AS raw_rank
      FROM candidate_search_document csd
      INNER JOIN candidate c ON c.id = csd.candidate_id
      WHERE c.lifecycle_state = $2::"CandidateLifecycleState"
        AND csd.fts_vector IS NOT NULL
    ),
    max_rank AS (
      SELECT GREATEST(MAX(raw_rank), 0.0001) AS mr FROM lexical
    ),
    combined AS (
      SELECT
        COALESCE(s.candidate_id, l.candidate_id) AS candidate_id,
        COALESCE(s.semantic_score, 0) AS semantic_score,
        COALESCE(l.raw_rank / mr.mr, 0) AS lexical_score
      FROM semantic s
      FULL OUTER JOIN lexical l ON s.candidate_id = l.candidate_id
      CROSS JOIN max_rank mr
    )
    SELECT
      combined.candidate_id,
      (dr.fields ->> 'fullName') AS candidate_name,
      combined.semantic_score::float8 AS semantic_score,
      combined.lexical_score::float8 AS lexical_score
    FROM combined
    LEFT JOIN data_record dr ON dr.candidate_id = combined.candidate_id
    ORDER BY ($4::float8 * combined.semantic_score + $5::float8 * combined.lexical_score) DESC
    LIMIT $6
    `,
    queryVecLiteral,
    lifecycleState,
    args.query,
    SEMANTIC_WEIGHT,
    LEXICAL_WEIGHT,
    limit,
  );

  const results: SearchResult[] = rows.map((row) => {
    const semanticScore = Math.max(0, Math.min(1, Number(row.semantic_score)));
    const lexicalScore = Math.max(0, Math.min(1, Number(row.lexical_score)));
    const score = SEMANTIC_WEIGHT * semanticScore + LEXICAL_WEIGHT * lexicalScore;

    return {
      candidateId: row.candidate_id,
      candidateName: row.candidate_name ?? null,
      score: Math.round(score * 10000) / 10000,
      semanticScore: Math.round(semanticScore * 10000) / 10000,
      lexicalScore: Math.round(lexicalScore * 10000) / 10000,
    };
  });

  return { results };
}

// Exported for testing
export const __private = { SEMANTIC_WEIGHT, LEXICAL_WEIGHT, DEFAULT_LIMIT, MAX_LIMIT };
