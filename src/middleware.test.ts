import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth/jwt before importing middleware
vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(async () => null),
}));

import { middleware } from "@/middleware";
import { getToken } from "next-auth/jwt";

const mockedGetToken = vi.mocked(getToken);

function makeReq(path: string, headers?: Record<string, string>): NextRequest {
  const url = `http://localhost:3000${path}`;
  return new NextRequest(url, {
    headers: headers ? new Headers(headers) : undefined,
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  mockedGetToken.mockReset().mockResolvedValue(null);
});

// ──── Static assets bypass ────

describe("static asset bypass", () => {
  it.each(["/_next/static/chunk.js", "/favicon.ico", "/robots.txt", "/sitemap.xml"])(
    "passes through %s without auth check",
    async (path) => {
      const res = await middleware(makeReq(path));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-middleware-next")).toBe("1"); // NextResponse.next()
    },
  );
});

// ──── Public prefixes bypass ────

describe("public prefixes", () => {
  it.each(["/auth/signin", "/api/auth/session", "/api/health"])(
    "passes through %s without auth check",
    async (path) => {
      const res = await middleware(makeReq(path));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-middleware-next")).toBe("1");
    },
  );
});

// ──── /api/internal token gate ────

describe("/api/internal token gate", () => {
  const internalPath = "/api/internal/ocr-callback";

  it("returns 403 when PRISM_INTERNAL_WORKER_TOKEN is not set", async () => {
    // Env var not set — should reject even if header is provided
    vi.stubEnv("PRISM_INTERNAL_WORKER_TOKEN", "");
    const res = await middleware(makeReq(internalPath, { "x-prism-internal-token": "anything" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 403 when header is missing", async () => {
    vi.stubEnv("PRISM_INTERNAL_WORKER_TOKEN", "s3cret");
    const res = await middleware(makeReq(internalPath));
    expect(res.status).toBe(403);
  });

  it("returns 403 when header does not match token", async () => {
    vi.stubEnv("PRISM_INTERNAL_WORKER_TOKEN", "s3cret");
    const res = await middleware(makeReq(internalPath, { "x-prism-internal-token": "wrong" }));
    expect(res.status).toBe(403);
  });

  it("passes through when header matches token", async () => {
    vi.stubEnv("PRISM_INTERNAL_WORKER_TOKEN", "s3cret");
    const res = await middleware(
      makeReq(internalPath, { "x-prism-internal-token": "s3cret" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});

// ──── Authenticated / unauthenticated redirect ────

describe("auth redirect", () => {
  it("redirects unauthenticated users to /auth/signin", async () => {
    mockedGetToken.mockResolvedValue(null);
    const res = await middleware(makeReq("/dashboard"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/auth/signin");
    expect(location).toContain("callbackUrl=");
  });

  it("passes through authenticated users", async () => {
    mockedGetToken.mockResolvedValue({ sub: "u1", role: "ADMIN" } as never);
    const res = await middleware(makeReq("/dashboard"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
