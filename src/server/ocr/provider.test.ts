import { describe, expect, it, vi } from "vitest";

describe("getOcrProvider", () => {
  it("defaults to noop provider", async () => {
    vi.stubEnv("OCR_PROVIDER", "");
    const mod = await import("./provider");
    const provider = mod.getOcrProvider();
    expect(provider.name).toBe("noop");
  });
});

