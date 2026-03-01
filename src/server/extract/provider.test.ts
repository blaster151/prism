import { describe, expect, it, vi } from "vitest";

describe("getExtractProvider", () => {
  it("defaults to noop provider", async () => {
    vi.stubEnv("EXTRACT_PROVIDER", "");
    const mod = await import("./provider");
    const provider = mod.getExtractProvider();
    expect(provider.name).toBe("noop");
  });
});

