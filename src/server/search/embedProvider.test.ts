import { describe, expect, it, vi } from "vitest";

describe("embedProvider", () => {
  describe("getEmbedProvider", () => {
    it("defaults to noop when EMBED_PROVIDER is unset", async () => {
      vi.stubEnv("EMBED_PROVIDER", "");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      expect(provider.name).toBe("noop");
      expect(provider.dimensions).toBe(1536);
    });

    it("returns noop when EMBED_PROVIDER is 'noop'", async () => {
      vi.stubEnv("EMBED_PROVIDER", "noop");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      expect(provider.name).toBe("noop");
    });

    it("returns openai when EMBED_PROVIDER is 'openai'", async () => {
      vi.stubEnv("EMBED_PROVIDER", "openai");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      expect(provider.name).toBe("openai");
      expect(provider.dimensions).toBe(1536);
    });

    it("returns openai case-insensitively", async () => {
      vi.stubEnv("EMBED_PROVIDER", "OpenAI");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      expect(provider.name).toBe("openai");
    });
  });

  describe("NoopEmbedProvider", () => {
    it("returns deterministic 1536-dim vector", async () => {
      vi.stubEnv("EMBED_PROVIDER", "noop");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      const v1 = await provider.embed("hello");
      const v2 = await provider.embed("hello");
      expect(v1).toEqual(v2);
      expect(v1).toHaveLength(1536);
    });

    it("produces different vectors for different inputs", async () => {
      vi.stubEnv("EMBED_PROVIDER", "noop");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      const v1 = await provider.embed("hello");
      const v2 = await provider.embed("world");
      expect(v1).not.toEqual(v2);
    });

    it("vector values are in [-1, 1) range", async () => {
      vi.stubEnv("EMBED_PROVIDER", "noop");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      const v = await provider.embed("test input for range check");
      for (const val of v) {
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe("OpenAiEmbedProvider", () => {
    it("throws MISCONFIGURED when EMBED_PROVIDER_API_KEY is missing", async () => {
      vi.stubEnv("EMBED_PROVIDER", "openai");
      vi.stubEnv("EMBED_PROVIDER_API_KEY", "");
      const { getEmbedProvider } = await import("./embedProvider");
      const provider = getEmbedProvider();
      await expect(provider.embed("test")).rejects.toMatchObject({
        code: "MISCONFIGURED",
        httpStatus: 500,
      });
    });

    it("throws UPSTREAM_ERROR on non-ok response", async () => {
      vi.stubEnv("EMBED_PROVIDER", "openai");
      vi.stubEnv("EMBED_PROVIDER_API_KEY", "sk-test-key");
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("rate limited", { status: 429 }),
      );
      try {
        const { getEmbedProvider } = await import("./embedProvider");
        const provider = getEmbedProvider();
        await expect(provider.embed("test")).rejects.toMatchObject({
          code: "UPSTREAM_ERROR",
          httpStatus: 502,
        });
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it("throws UPSTREAM_ERROR on malformed response", async () => {
      vi.stubEnv("EMBED_PROVIDER", "openai");
      vi.stubEnv("EMBED_PROVIDER_API_KEY", "sk-test-key");
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2] }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      try {
        const { getEmbedProvider } = await import("./embedProvider");
        const provider = getEmbedProvider();
        await expect(provider.embed("test")).rejects.toMatchObject({
          code: "UPSTREAM_ERROR",
          message: expect.stringContaining("unexpected shape"),
        });
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it("returns vector on successful response", async () => {
      vi.stubEnv("EMBED_PROVIDER", "openai");
      vi.stubEnv("EMBED_PROVIDER_API_KEY", "sk-test-key");
      const fakeVector = Array.from({ length: 1536 }, (_, i) => i * 0.001 - 0.5);
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({ data: [{ embedding: fakeVector }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      try {
        const { getEmbedProvider } = await import("./embedProvider");
        const provider = getEmbedProvider();
        const result = await provider.embed("some candidate text");
        expect(result).toEqual(fakeVector);
        expect(result).toHaveLength(1536);

        // Verify the API was called correctly
        expect(fetchSpy).toHaveBeenCalledWith(
          "https://api.openai.com/v1/embeddings",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer sk-test-key",
            }),
          }),
        );
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it("does not include API key in error details", async () => {
      vi.stubEnv("EMBED_PROVIDER", "openai");
      vi.stubEnv("EMBED_PROVIDER_API_KEY", "sk-secret-key-12345");
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("unauthorized", { status: 401 }),
      );
      try {
        const { getEmbedProvider } = await import("./embedProvider");
        const provider = getEmbedProvider();
        try {
          await provider.embed("test");
          expect.fail("Expected embed to throw");
        } catch (e: unknown) {
          const err = e as Error & { details?: Record<string, unknown> };
          const errStr = JSON.stringify(err) + JSON.stringify(err.details ?? {});
          expect(errStr).not.toContain("sk-secret-key-12345");
        }
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });
});
