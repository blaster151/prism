import { describe, expect, it } from "vitest";

import { __private } from "./indexService";

describe("indexService", () => {
  it("builds stable fts text", () => {
    const txt = __private.buildFtsText({ fullName: "Jane Doe", email: "jane@example.com", extra: "x" });
    expect(txt).toContain("Jane Doe");
    expect(txt).toContain("jane@example.com");
  });

  it("includes bounded JSON of remaining fields in fts text", () => {
    const txt = __private.buildFtsText({ fullName: "Jane Doe", skills: "TypeScript" });
    expect(txt).toContain("Jane Doe");
    expect(txt).toContain("TypeScript");
  });

  it("handles empty fields gracefully", () => {
    const txt = __private.buildFtsText({});
    expect(txt).toBe("");
  });

  it("trims whitespace-only values", () => {
    const txt = __private.buildFtsText({ fullName: "  ", email: "jane@example.com" });
    expect(txt).not.toContain("  ");
    expect(txt).toContain("jane@example.com");
  });
});

