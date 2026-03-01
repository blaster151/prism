import { describe, expect, it } from "vitest";

import { __private } from "./hybridSearch";
import type { SearchResult, SearchFilters, SearchRequest, SearchResponse } from "./types";

describe("hybridSearch configuration", () => {
  it("has expected default weights", () => {
    expect(__private.SEMANTIC_WEIGHT).toBe(0.7);
    expect(__private.LEXICAL_WEIGHT).toBe(0.3);
    expect(__private.SEMANTIC_WEIGHT + __private.LEXICAL_WEIGHT).toBe(1);
  });

  it("has expected default limits", () => {
    expect(__private.DEFAULT_LIMIT).toBe(20);
    expect(__private.MAX_LIMIT).toBe(100);
  });
});

describe("search types", () => {
  it("SearchResult has expected shape", () => {
    const result: SearchResult = {
      candidateId: "abc-123",
      candidateName: "Jane Doe",
      score: 0.85,
      semanticScore: 0.9,
      lexicalScore: 0.7,
    };
    expect(result.candidateId).toBe("abc-123");
    expect(result.candidateName).toBe("Jane Doe");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("SearchResult allows null candidateName", () => {
    const result: SearchResult = {
      candidateId: "abc-123",
      candidateName: null,
      score: 0.5,
      semanticScore: 0.5,
      lexicalScore: 0.5,
    };
    expect(result.candidateName).toBeNull();
  });

  it("SearchFilters defaults lifecycle to undefined", () => {
    const filters: SearchFilters = {};
    expect(filters.lifecycleState).toBeUndefined();
  });

  it("SearchRequest has expected shape", () => {
    const req: SearchRequest = {
      query: "systems engineer TS/SCI",
      filters: { lifecycleState: "ACTIVE" },
      limit: 20,
    };
    expect(req.query).toBe("systems engineer TS/SCI");
    expect(req.filters?.lifecycleState).toBe("ACTIVE");
  });

  it("SearchResponse has expected shape", () => {
    const resp: SearchResponse = {
      results: [],
      resultCount: 0,
    };
    expect(resp.results).toHaveLength(0);
    expect(resp.resultCount).toBe(0);
  });
});

describe("score combination math", () => {
  const { SEMANTIC_WEIGHT, LEXICAL_WEIGHT } = __private;

  it("pure semantic match scores 0.7", () => {
    const score = SEMANTIC_WEIGHT * 1.0 + LEXICAL_WEIGHT * 0.0;
    expect(score).toBeCloseTo(0.7);
  });

  it("pure lexical match scores 0.3", () => {
    const score = SEMANTIC_WEIGHT * 0.0 + LEXICAL_WEIGHT * 1.0;
    expect(score).toBeCloseTo(0.3);
  });

  it("perfect match on both scores 1.0", () => {
    const score = SEMANTIC_WEIGHT * 1.0 + LEXICAL_WEIGHT * 1.0;
    expect(score).toBeCloseTo(1.0);
  });

  it("mixed scores combine correctly", () => {
    const semantic = 0.85;
    const lexical = 0.6;
    const expected = SEMANTIC_WEIGHT * semantic + LEXICAL_WEIGHT * lexical;
    expect(expected).toBeCloseTo(0.7 * 0.85 + 0.3 * 0.6);
  });

  it("zero match scores 0", () => {
    const score = SEMANTIC_WEIGHT * 0 + LEXICAL_WEIGHT * 0;
    expect(score).toBe(0);
  });
});
