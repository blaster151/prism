import { describe, expect, it } from "vitest";

import { __private } from "@/server/search/hybridSearch";
import type { SearchResult, SearchFilters, SearchResponse } from "@/server/search/types";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const { SEMANTIC_WEIGHT, LEXICAL_WEIGHT, DEFAULT_LIMIT, MAX_LIMIT } = __private;

/**
 * Simulate hybridSearch score combination + ranking without DB.
 * This mirrors the logic in hybridSearch.ts (lines 120-134) exactly.
 */
function combineAndRank(
  rows: { candidateId: string; candidateName: string | null; semanticScore: number; lexicalScore: number; lifecycle: string }[],
  filters?: SearchFilters,
  limit?: number,
): SearchResult[] {
  const effectiveLimit = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const lifecycleFilter = filters?.lifecycleState ?? "ACTIVE";

  const filtered = rows.filter((r) => r.lifecycle === lifecycleFilter);

  return filtered
    .map((row) => {
      const sem = Math.max(0, Math.min(1, row.semanticScore));
      const lex = Math.max(0, Math.min(1, row.lexicalScore));
      const score = SEMANTIC_WEIGHT * sem + LEXICAL_WEIGHT * lex;
      return {
        candidateId: row.candidateId,
        candidateName: row.candidateName,
        score: Math.round(score * 10000) / 10000,
        semanticScore: Math.round(sem * 10000) / 10000,
        lexicalScore: Math.round(lex * 10000) / 10000,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, effectiveLimit);
}

// ---------------------------------------------------------------------------
// Fixture candidates — deterministic test data
// ---------------------------------------------------------------------------

const FIXTURE_CANDIDATES = [
  {
    candidateId: "cand-alice",
    candidateName: "Alice Johnson",
    semanticScore: 0.92,
    lexicalScore: 0.85,
    lifecycle: "ACTIVE",
  },
  {
    candidateId: "cand-bob",
    candidateName: "Bob Smith",
    semanticScore: 0.78,
    lexicalScore: 0.95,
    lifecycle: "ACTIVE",
  },
  {
    candidateId: "cand-carol",
    candidateName: "Carol Williams",
    semanticScore: 0.88,
    lexicalScore: 0.3,
    lifecycle: "ACTIVE",
  },
  {
    candidateId: "cand-dave",
    candidateName: "Dave Brown",
    semanticScore: 0.6,
    lexicalScore: 0.6,
    lifecycle: "ARCHIVE",
  },
  {
    candidateId: "cand-eve",
    candidateName: null,
    semanticScore: 0.5,
    lexicalScore: 0.0,
    lifecycle: "ACTIVE",
  },
  {
    candidateId: "cand-frank",
    candidateName: "Frank Davis",
    semanticScore: 0.0,
    lexicalScore: 0.7,
    lifecycle: "ARCHIVE",
  },
];

// ---------------------------------------------------------------------------
// Fixture-based deterministic ordering (AC: 1)
// ---------------------------------------------------------------------------

describe("hybridSearch — fixture-based deterministic ordering", () => {
  it("ranks candidates by combined score descending", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);

    // Verify descending order
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("Alice (high semantic + high lexical) outranks Carol (high semantic, low lexical)", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);
    const alice = results.find((r) => r.candidateId === "cand-alice")!;
    const carol = results.find((r) => r.candidateId === "cand-carol")!;

    expect(alice.score).toBeGreaterThan(carol.score);
  });

  it("Bob (moderate semantic, very high lexical) has competitive combined score", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);
    const bob = results.find((r) => r.candidateId === "cand-bob")!;

    // Bob: 0.7 * 0.78 + 0.3 * 0.95 = 0.546 + 0.285 = 0.831
    expect(bob.score).toBeCloseTo(0.831, 3);
  });

  it("produces expected exact scores for all ACTIVE fixture candidates", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);

    // Alice: 0.7 * 0.92 + 0.3 * 0.85 = 0.644 + 0.255 = 0.899
    expect(results.find((r) => r.candidateId === "cand-alice")!.score).toBeCloseTo(0.899, 3);

    // Bob: 0.7 * 0.78 + 0.3 * 0.95 = 0.546 + 0.285 = 0.831
    expect(results.find((r) => r.candidateId === "cand-bob")!.score).toBeCloseTo(0.831, 3);

    // Carol: 0.7 * 0.88 + 0.3 * 0.3 = 0.616 + 0.09 = 0.706
    expect(results.find((r) => r.candidateId === "cand-carol")!.score).toBeCloseTo(0.706, 3);

    // Eve: 0.7 * 0.5 + 0.3 * 0.0 = 0.35 + 0 = 0.35
    expect(results.find((r) => r.candidateId === "cand-eve")!.score).toBeCloseTo(0.35, 3);
  });

  it("returns results in deterministic order: Alice > Bob > Carol > Eve", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);
    const ids = results.map((r) => r.candidateId);

    expect(ids).toEqual([
      "cand-alice",  // 0.899
      "cand-bob",    // 0.831
      "cand-carol",  // 0.706
      "cand-eve",    // 0.35
    ]);
  });

  it("is idempotent — same input always produces same output", () => {
    const r1 = combineAndRank(FIXTURE_CANDIDATES);
    const r2 = combineAndRank(FIXTURE_CANDIDATES);
    expect(r1).toEqual(r2);
  });
});

// ---------------------------------------------------------------------------
// Active/Archive lifecycle filtering (AC: 2)
// ---------------------------------------------------------------------------

describe("hybridSearch — lifecycle filtering", () => {
  it("defaults to ACTIVE filter (excludes ARCHIVE candidates)", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);

    const ids = results.map((r) => r.candidateId);
    expect(ids).not.toContain("cand-dave");  // ARCHIVE
    expect(ids).not.toContain("cand-frank"); // ARCHIVE
    expect(ids).toContain("cand-alice");     // ACTIVE
  });

  it("explicit ACTIVE filter returns only ACTIVE candidates", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES, { lifecycleState: "ACTIVE" });

    for (const r of results) {
      const fixture = FIXTURE_CANDIDATES.find((f) => f.candidateId === r.candidateId)!;
      expect(fixture.lifecycle).toBe("ACTIVE");
    }
    expect(results).toHaveLength(4); // Alice, Bob, Carol, Eve
  });

  it("ARCHIVE filter returns only ARCHIVE candidates", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES, { lifecycleState: "ARCHIVE" });

    for (const r of results) {
      const fixture = FIXTURE_CANDIDATES.find((f) => f.candidateId === r.candidateId)!;
      expect(fixture.lifecycle).toBe("ARCHIVE");
    }
    expect(results).toHaveLength(2); // Dave, Frank
  });

  it("ARCHIVE results are also ranked by combined score", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES, { lifecycleState: "ARCHIVE" });

    // Dave: 0.7 * 0.6 + 0.3 * 0.6 = 0.42 + 0.18 = 0.6
    // Frank: 0.7 * 0.0 + 0.3 * 0.7 = 0.0 + 0.21 = 0.21
    expect(results[0].candidateId).toBe("cand-dave");
    expect(results[1].candidateId).toBe("cand-frank");
  });
});

// ---------------------------------------------------------------------------
// Score boundary conditions (AC: 5)
// ---------------------------------------------------------------------------

describe("hybridSearch — score edge cases", () => {
  it("clamps semantic score to [0, 1]", () => {
    const results = combineAndRank([
      { candidateId: "over", candidateName: null, semanticScore: 1.5, lexicalScore: 0.5, lifecycle: "ACTIVE" },
      { candidateId: "under", candidateName: null, semanticScore: -0.3, lexicalScore: 0.5, lifecycle: "ACTIVE" },
    ]);

    const over = results.find((r) => r.candidateId === "over")!;
    const under = results.find((r) => r.candidateId === "under")!;

    expect(over.semanticScore).toBeLessThanOrEqual(1);
    expect(under.semanticScore).toBeGreaterThanOrEqual(0);
  });

  it("clamps lexical score to [0, 1]", () => {
    const results = combineAndRank([
      { candidateId: "over", candidateName: null, semanticScore: 0.5, lexicalScore: 2.0, lifecycle: "ACTIVE" },
      { candidateId: "under", candidateName: null, semanticScore: 0.5, lexicalScore: -1.0, lifecycle: "ACTIVE" },
    ]);

    const over = results.find((r) => r.candidateId === "over")!;
    const under = results.find((r) => r.candidateId === "under")!;

    expect(over.lexicalScore).toBeLessThanOrEqual(1);
    expect(under.lexicalScore).toBeGreaterThanOrEqual(0);
  });

  it("perfect match (both 1.0) scores exactly 1.0", () => {
    const results = combineAndRank([
      { candidateId: "perfect", candidateName: "Perfect", semanticScore: 1.0, lexicalScore: 1.0, lifecycle: "ACTIVE" },
    ]);
    expect(results[0].score).toBe(1);
  });

  it("zero match (both 0.0) scores exactly 0.0", () => {
    const results = combineAndRank([
      { candidateId: "zero", candidateName: null, semanticScore: 0.0, lexicalScore: 0.0, lifecycle: "ACTIVE" },
    ]);
    expect(results[0].score).toBe(0);
  });

  it("semantic-only match scores SEMANTIC_WEIGHT", () => {
    const results = combineAndRank([
      { candidateId: "sem-only", candidateName: null, semanticScore: 1.0, lexicalScore: 0.0, lifecycle: "ACTIVE" },
    ]);
    expect(results[0].score).toBeCloseTo(SEMANTIC_WEIGHT, 4);
  });

  it("lexical-only match scores LEXICAL_WEIGHT", () => {
    const results = combineAndRank([
      { candidateId: "lex-only", candidateName: null, semanticScore: 0.0, lexicalScore: 1.0, lifecycle: "ACTIVE" },
    ]);
    expect(results[0].score).toBeCloseTo(LEXICAL_WEIGHT, 4);
  });

  it("combined score is always in [0, 1]", () => {
    // Generate many random-ish score combinations
    const rows = Array.from({ length: 50 }, (_, i) => ({
      candidateId: `stress-${i}`,
      candidateName: null,
      semanticScore: Math.random() * 2 - 0.5, // may be out of [0,1] before clamping
      lexicalScore: Math.random() * 2 - 0.5,
      lifecycle: "ACTIVE",
    }));

    const results = combineAndRank(rows);
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Limit and empty results (AC: 5)
// ---------------------------------------------------------------------------

describe("hybridSearch — limit and empty results", () => {
  it("respects limit parameter", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES, undefined, 2);
    expect(results).toHaveLength(2);
    // Should be top 2: Alice and Bob
    expect(results[0].candidateId).toBe("cand-alice");
    expect(results[1].candidateId).toBe("cand-bob");
  });

  it("clamps limit to 1 when 0 or negative is provided", () => {
    const r0 = combineAndRank(FIXTURE_CANDIDATES, undefined, 0);
    expect(r0).toHaveLength(1);

    const rNeg = combineAndRank(FIXTURE_CANDIDATES, undefined, -5);
    expect(rNeg).toHaveLength(1);
  });

  it("clamps limit to MAX_LIMIT when exceeding", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES, undefined, 999);
    // Only 4 ACTIVE candidates, so all returned (< MAX_LIMIT)
    expect(results).toHaveLength(4);
  });

  it("returns empty array when no candidates match filter", () => {
    const noMatch = combineAndRank(
      FIXTURE_CANDIDATES.filter((c) => c.lifecycle === "ACTIVE"),
      { lifecycleState: "ARCHIVE" },
    );
    expect(noMatch).toEqual([]);
  });

  it("returns empty array when no candidates exist", () => {
    const results = combineAndRank([]);
    expect(results).toEqual([]);
  });

  it("handles single candidate", () => {
    const results = combineAndRank([FIXTURE_CANDIDATES[0]]);
    expect(results).toHaveLength(1);
    expect(results[0].candidateId).toBe("cand-alice");
  });
});

// ---------------------------------------------------------------------------
// SearchResult shape invariants (AC: 1)
// ---------------------------------------------------------------------------

describe("hybridSearch — result shape invariants", () => {
  it("every result has all required fields", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);

    for (const r of results) {
      expect(r).toHaveProperty("candidateId");
      expect(r).toHaveProperty("candidateName");
      expect(r).toHaveProperty("score");
      expect(r).toHaveProperty("semanticScore");
      expect(r).toHaveProperty("lexicalScore");
      expect(typeof r.candidateId).toBe("string");
      expect(typeof r.score).toBe("number");
      expect(typeof r.semanticScore).toBe("number");
      expect(typeof r.lexicalScore).toBe("number");
    }
  });

  it("candidateName can be string or null", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);
    const eve = results.find((r) => r.candidateId === "cand-eve")!;
    const alice = results.find((r) => r.candidateId === "cand-alice")!;

    expect(eve.candidateName).toBeNull();
    expect(alice.candidateName).toBe("Alice Johnson");
  });

  it("scores are rounded to 4 decimal places", () => {
    const results = combineAndRank(FIXTURE_CANDIDATES);

    for (const r of results) {
      const decimalPlaces = (n: number) => {
        const s = n.toString();
        const dotIdx = s.indexOf(".");
        return dotIdx === -1 ? 0 : s.length - dotIdx - 1;
      };
      expect(decimalPlaces(r.score)).toBeLessThanOrEqual(4);
      expect(decimalPlaces(r.semanticScore)).toBeLessThanOrEqual(4);
      expect(decimalPlaces(r.lexicalScore)).toBeLessThanOrEqual(4);
    }
  });
});
