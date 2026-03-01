import { describe, expect, it } from "vitest";

import { __private } from "./indexService";

describe("indexService", () => {
  it("builds stable fts text", () => {
    const txt = __private.buildFtsText({ fullName: "Jane Doe", email: "jane@example.com", extra: "x" });
    expect(txt).toContain("Jane Doe");
    expect(txt).toContain("jane@example.com");
  });

  it("generates deterministic embedding vector with 1536 dimensions", () => {
    const v1 = __private.deterministicEmbeddingVector("hello");
    const v2 = __private.deterministicEmbeddingVector("hello");
    expect(v1).toEqual(v2);
    expect(v1).toHaveLength(1536);
  });

  it("generates different vectors for different inputs", () => {
    const v1 = __private.deterministicEmbeddingVector("hello");
    const v2 = __private.deterministicEmbeddingVector("world");
    expect(v1).not.toEqual(v2);
    expect(v2).toHaveLength(1536);
  });

  it("vector values are in [-1, 1) range", () => {
    const v = __private.deterministicEmbeddingVector("test input");
    for (const val of v) {
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThan(1);
    }
  });
});

