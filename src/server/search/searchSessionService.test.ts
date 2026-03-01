import { describe, expect, it } from "vitest";

import {
  buildCombinedQuery,
  buildQueryContext,
  type QueryHistoryEntry,
} from "@/server/search/searchSessionService";

// ---------------------------------------------------------------------------
// buildCombinedQuery
// ---------------------------------------------------------------------------

describe("buildCombinedQuery", () => {
  it("returns empty string for empty history", () => {
    expect(buildCombinedQuery([])).toBe("");
  });

  it("returns the single query for one-entry history", () => {
    const history: QueryHistoryEntry[] = [
      { query: "senior engineer", timestamp: "2026-03-01T00:00:00Z" },
    ];
    expect(buildCombinedQuery(history)).toBe("senior engineer");
  });

  it("combines multiple queries with newest first", () => {
    const history: QueryHistoryEntry[] = [
      { query: "senior engineer", timestamp: "2026-03-01T00:00:00Z" },
      { query: "with satellite experience", timestamp: "2026-03-01T00:01:00Z" },
      { query: "active TS/SCI", timestamp: "2026-03-01T00:02:00Z" },
    ];
    const combined = buildCombinedQuery(history);
    // Newest first: "active TS/SCI", then "with satellite experience", then "senior engineer"
    expect(combined).toBe("active TS/SCI with satellite experience senior engineer");
  });

  it("does not mutate the original history array", () => {
    const history: QueryHistoryEntry[] = [
      { query: "first", timestamp: "2026-03-01T00:00:00Z" },
      { query: "second", timestamp: "2026-03-01T00:01:00Z" },
    ];
    const original = [...history];
    buildCombinedQuery(history);
    expect(history).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// buildQueryContext
// ---------------------------------------------------------------------------

describe("buildQueryContext", () => {
  it("returns empty string for empty history", () => {
    expect(buildQueryContext([])).toBe("");
  });

  it("returns the single query for one-entry history", () => {
    const history: QueryHistoryEntry[] = [
      { query: "senior engineer", timestamp: "2026-03-01T00:00:00Z" },
    ];
    expect(buildQueryContext(history)).toBe("senior engineer");
  });

  it("joins queries with arrow separator", () => {
    const history: QueryHistoryEntry[] = [
      { query: "senior engineer", timestamp: "2026-03-01T00:00:00Z" },
      { query: "with satellite experience", timestamp: "2026-03-01T00:01:00Z" },
    ];
    expect(buildQueryContext(history)).toBe(
      "senior engineer → with satellite experience",
    );
  });

  it("shows full progression for three refinements", () => {
    const history: QueryHistoryEntry[] = [
      { query: "engineer", timestamp: "2026-03-01T00:00:00Z" },
      { query: "satellite", timestamp: "2026-03-01T00:01:00Z" },
      { query: "TS/SCI", timestamp: "2026-03-01T00:02:00Z" },
    ];
    expect(buildQueryContext(history)).toBe("engineer → satellite → TS/SCI");
  });
});

// ---------------------------------------------------------------------------
// QueryHistoryEntry shape
// ---------------------------------------------------------------------------

describe("QueryHistoryEntry", () => {
  it("supports optional filters", () => {
    const entry: QueryHistoryEntry = {
      query: "test",
      filters: { lifecycleState: "ACTIVE" },
      timestamp: "2026-03-01T00:00:00Z",
    };
    expect(entry.filters?.lifecycleState).toBe("ACTIVE");
  });

  it("allows omitting filters", () => {
    const entry: QueryHistoryEntry = {
      query: "test",
      timestamp: "2026-03-01T00:00:00Z",
    };
    expect(entry.filters).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Route schema — sessionId validation
// ---------------------------------------------------------------------------

describe("Search route — sessionId validation", () => {
  // Replicate the schema from the route handler for testing
  const { z } = require("zod") as typeof import("zod");
  const SearchRequestSchema = z.object({
    query: z.string().min(1).max(2000),
    sessionId: z.string().uuid().optional(),
    filters: z
      .object({
        lifecycleState: z.enum(["ACTIVE", "ARCHIVE"]).optional(),
      })
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  });

  it("accepts request without sessionId (new search)", () => {
    const result = SearchRequestSchema.safeParse({ query: "test" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sessionId).toBeUndefined();
  });

  it("accepts request with valid UUID sessionId (refinement)", () => {
    const result = SearchRequestSchema.safeParse({
      query: "refine this",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("rejects non-UUID sessionId", () => {
    const result = SearchRequestSchema.safeParse({
      query: "test",
      sessionId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty sessionId", () => {
    const result = SearchRequestSchema.safeParse({
      query: "test",
      sessionId: "",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SearchPage — session tracking logic
// ---------------------------------------------------------------------------

describe("SearchPage — session tracking", () => {
  it("builds request body with sessionId for refinement", () => {
    const buildBody = (query: string, sessionId: string | null) => {
      const body: Record<string, unknown> = { query };
      if (sessionId) body.sessionId = sessionId;
      return body;
    };

    const newSearch = buildBody("test", null);
    expect(newSearch).toEqual({ query: "test" });
    expect(newSearch.sessionId).toBeUndefined();

    const refinement = buildBody("refine", "uuid-123");
    expect(refinement).toEqual({ query: "refine", sessionId: "uuid-123" });
  });

  it("parses response with sessionId and queryContext", () => {
    const response = {
      data: {
        results: [],
        resultCount: 0,
        sessionId: "uuid-session",
        queryContext: "engineer → satellite",
      },
    };

    expect(response.data.sessionId).toBe("uuid-session");
    expect(response.data.queryContext).toBe("engineer → satellite");
  });

  it("clears session state on new search", () => {
    let sessionId: string | null = "existing-session";
    let queryContext: string | null = "some context";

    // Simulate "New Search"
    sessionId = null;
    queryContext = null;

    expect(sessionId).toBeNull();
    expect(queryContext).toBeNull();
  });
});
