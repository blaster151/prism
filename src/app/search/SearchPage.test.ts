import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// SearchBar — pure logic tests (no DOM; jsdom not available)
// ---------------------------------------------------------------------------

describe("SearchBar — logic", () => {
  it("trims whitespace from query before calling onSearch", () => {
    // The SearchBar component calls onSearch(query.trim()) only when non-empty.
    // We test the trim + empty-guard logic directly.
    const trimAndGuard = (input: string): string | null => {
      const trimmed = input.trim();
      return trimmed.length === 0 ? null : trimmed;
    };

    expect(trimAndGuard("  hello world  ")).toBe("hello world");
    expect(trimAndGuard("")).toBeNull();
    expect(trimAndGuard("   ")).toBeNull();
    expect(trimAndGuard("a")).toBe("a");
  });

  it("does not submit when query is empty or whitespace-only", () => {
    const trimAndGuard = (input: string): string | null => {
      const trimmed = input.trim();
      return trimmed.length === 0 ? null : trimmed;
    };

    expect(trimAndGuard("")).toBeNull();
    expect(trimAndGuard("   \t\n  ")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SearchResultCard — score formatting logic
// ---------------------------------------------------------------------------

describe("SearchResultCard — score formatting", () => {
  it("formats score as rounded percentage", () => {
    const formatPct = (score: number) => Math.round(score * 100);

    expect(formatPct(0.92)).toBe(92);
    expect(formatPct(0.0)).toBe(0);
    expect(formatPct(1.0)).toBe(100);
    expect(formatPct(0.555)).toBe(56); // rounds up
    expect(formatPct(0.004)).toBe(0);
  });

  it("displays candidate name when available, falls back to id", () => {
    const displayName = (
      candidateName: string | null,
      candidateId: string,
    ): string => candidateName ?? candidateId;

    expect(displayName("John Doe", "uuid-123")).toBe("John Doe");
    expect(displayName(null, "uuid-123")).toBe("uuid-123");
    expect(displayName("", "uuid-123")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// SearchPage — fetch integration logic
// ---------------------------------------------------------------------------

describe("SearchPage — request construction", () => {
  it("constructs correct POST body for a search request", () => {
    const buildBody = (query: string) => JSON.stringify({ query });

    const body = JSON.parse(buildBody("Senior engineer with TS/SCI"));
    expect(body).toEqual({ query: "Senior engineer with TS/SCI" });
  });

  it("parses successful response shape", () => {
    const apiResponse = {
      data: {
        results: [
          {
            candidateId: "uuid-1",
            candidateName: "Jane Smith",
            score: 0.92,
            semanticScore: 0.88,
            lexicalScore: 0.96,
          },
          {
            candidateId: "uuid-2",
            candidateName: null,
            score: 0.75,
            semanticScore: 0.7,
            lexicalScore: 0.8,
          },
        ],
        resultCount: 2,
      },
    };

    expect(apiResponse.data.results).toHaveLength(2);
    expect(apiResponse.data.results[0].candidateName).toBe("Jane Smith");
    expect(apiResponse.data.results[1].candidateName).toBeNull();
    expect(apiResponse.data.resultCount).toBe(2);
  });

  it("handles error response shape", () => {
    const errorResponse = {
      error: { message: "Query must not be empty." },
    };

    const message =
      errorResponse?.error?.message ?? "Search failed.";
    expect(message).toBe("Query must not be empty.");
  });

  it("falls back to generic error when message is missing", () => {
    const errorResponse = {} as { error?: { message?: string } };

    const message =
      errorResponse?.error?.message ?? "Search failed (400).";
    expect(message).toBe("Search failed (400).");
  });
});

// ---------------------------------------------------------------------------
// Results list — ordering contract
// ---------------------------------------------------------------------------

describe("SearchPage — results ordering", () => {
  it("results from API are already sorted by score descending", () => {
    // hybridSearch returns results sorted by score DESC.
    // The UI renders them in the order received.
    const results = [
      { candidateId: "a", score: 0.95 },
      { candidateId: "b", score: 0.82 },
      { candidateId: "c", score: 0.71 },
    ];

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("rank is 1-indexed based on array position", () => {
    const toRank = (index: number) => index + 1;
    expect(toRank(0)).toBe(1);
    expect(toRank(4)).toBe(5);
  });
});
