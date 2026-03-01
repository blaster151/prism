import { describe, expect, it } from "vitest";
import { z } from "zod";

// Recreate the schema from the route handler for isolated testing
const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query must not be empty.").max(2000),
  sessionId: z.string().uuid().optional(),
  filters: z
    .object({
      lifecycleState: z.enum(["ACTIVE", "ARCHIVE"]).optional(),
    })
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

describe("SearchRequestSchema validation", () => {
  it("accepts valid request with all fields", () => {
    const result = SearchRequestSchema.safeParse({
      query: "senior engineer TS/SCI",
      filters: { lifecycleState: "ACTIVE" },
      limit: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("senior engineer TS/SCI");
      expect(result.data.filters?.lifecycleState).toBe("ACTIVE");
      expect(result.data.limit).toBe(50);
    }
  });

  it("accepts minimal request (query only)", () => {
    const result = SearchRequestSchema.safeParse({ query: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20); // default
      expect(result.data.filters).toBeUndefined();
    }
  });

  it("rejects empty query", () => {
    const result = SearchRequestSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing query", () => {
    const result = SearchRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects query longer than 2000 chars", () => {
    const result = SearchRequestSchema.safeParse({ query: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = SearchRequestSchema.safeParse({ query: "test", limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 100", () => {
    const result = SearchRequestSchema.safeParse({ query: "test", limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid lifecycle state", () => {
    const result = SearchRequestSchema.safeParse({
      query: "test",
      filters: { lifecycleState: "DELETED" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts ARCHIVE lifecycle filter", () => {
    const result = SearchRequestSchema.safeParse({
      query: "test",
      filters: { lifecycleState: "ARCHIVE" },
    });
    expect(result.success).toBe(true);
  });

  it("coerces string limit to number", () => {
    const result = SearchRequestSchema.safeParse({ query: "test", limit: "25" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });
});
