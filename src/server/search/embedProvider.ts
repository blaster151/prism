import { AppError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmbedProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

export type EmbedResult = {
  provider: string;
  dimensions: number;
  vector: number[];
};

// ---------------------------------------------------------------------------
// Noop / deterministic provider (default for CI & tests)
// ---------------------------------------------------------------------------

class NoopEmbedProvider implements EmbedProvider {
  public readonly name = "noop";
  public readonly dimensions = 1536;

  /**
   * Deterministic 1536-dim vector derived from text via FNV-1a + XorShift.
   * Moved from indexService.deterministicEmbeddingVector (Story 4.1).
   */
  async embed(text: string): Promise<number[]> {
    const DIMS = this.dimensions;
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const vec: number[] = [];
    let x = h >>> 0;
    for (let i = 0; i < DIMS; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      vec.push(((x >>> 0) % 2000) / 1000 - 1); // [-1, 1)
    }
    return vec;
  }
}

// ---------------------------------------------------------------------------
// OpenAI provider (production)
// ---------------------------------------------------------------------------

class OpenAiEmbedProvider implements EmbedProvider {
  public readonly name = "openai";
  public readonly dimensions = 1536;

  async embed(text: string): Promise<number[]> {
    const apiKey = process.env.EMBED_PROVIDER_API_KEY;
    if (!apiKey) {
      throw new AppError({
        code: "MISCONFIGURED",
        message: "OpenAI embedding provider is not configured: missing EMBED_PROVIDER_API_KEY.",
        httpStatus: 500,
        details: { missing: "EMBED_PROVIDER_API_KEY" },
      });
    }

    const model =
      process.env.EMBED_OPENAI_MODEL ?? "text-embedding-3-small";

    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model,
        dimensions: this.dimensions,
      }),
    });

    if (!resp.ok) {
      // Never include API key or raw text in error details.
      const body = await resp.text().catch(() => "(unreadable)");
      throw new AppError({
        code: "UPSTREAM_ERROR",
        message: `OpenAI embeddings API returned ${resp.status}.`,
        httpStatus: 502,
        details: { status: resp.status, body: body.slice(0, 500) },
      });
    }

    const json = (await resp.json()) as {
      data?: { embedding?: number[] }[];
    };

    const vector = json?.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length !== this.dimensions) {
      throw new AppError({
        code: "UPSTREAM_ERROR",
        message: `OpenAI embeddings API returned unexpected shape (got ${vector?.length ?? "undefined"} dims, expected ${this.dimensions}).`,
        httpStatus: 502,
      });
    }

    return vector;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function getEmbedProvider(): EmbedProvider {
  const configured = (
    process.env.EMBED_PROVIDER ?? "noop"
  ).toLowerCase();

  if (configured === "openai") return new OpenAiEmbedProvider();
  return new NoopEmbedProvider();
}
