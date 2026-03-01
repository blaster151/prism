import { describe, expect, it } from "vitest";

import { __private } from "./indexService";

describe("indexService", () => {
  it("builds stable fts text", () => {
    const txt = __private.buildFtsText({ fullName: "Jane Doe", email: "jane@example.com", extra: "x" });
    expect(txt).toContain("Jane Doe");
    expect(txt).toContain("jane@example.com");
  });

  it("generates deterministic embedding vector", () => {
    const v1 = __private.deterministicEmbeddingVector("hello");
    const v2 = __private.deterministicEmbeddingVector("hello");
    expect(v1).toEqual(v2);
    expect(v1).toHaveLength(8);
  });
});

