import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: vi.fn(async () => ({ id: "ae1" })),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "$2a$12$hashed"),
    compare: vi.fn(async (_plain: string, hash: string) => hash === "$2a$12$correct"),
  },
}));

import { authOptions } from "@/server/auth";

// Extract the authorize function from the credentials provider
const credProvider = authOptions.providers[0];
const authorize = (credProvider as { options: { authorize: (credentials: Record<string, string> | undefined) => Promise<unknown> } }).options.authorize;

// Extract callbacks
const jwtCallback = authOptions.callbacks!.jwt!;
const sessionCallback = authOptions.callbacks!.session!;

// Extract events
const signInEvent = authOptions.events!.signIn!;
const signOutEvent = authOptions.events!.signOut!;

// ── Helpers ────────────────────────────────────────────

const activeUser = {
  id: "u1",
  email: "alice@example.com",
  role: "ADMIN",
  status: "ACTIVE",
  passwordHash: "$2a$12$correct",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PRISM_ALLOW_USER_CREATE", "false");
});

// ──── authorize() ─────────────────────────────────────

describe("authorize — credentials provider", () => {
  it("returns null for empty credentials", async () => {
    expect(await authorize(undefined)).toBeNull();
  });

  it("returns null for empty email", async () => {
    expect(await authorize({ email: "", password: "pw" })).toBeNull();
  });

  it("returns null for empty password", async () => {
    expect(await authorize({ email: "a@b.com", password: "" })).toBeNull();
  });

  it("returns user on valid email + correct password", async () => {
    mockFindUnique.mockResolvedValue(activeUser);
    const result = await authorize({ email: "Alice@Example.COM", password: "pw" });
    expect(result).toEqual({ id: "u1", email: "alice@example.com", role: "ADMIN" });
    // Verify email was lowercased + trimmed for lookup
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: "alice@example.com" } });
  });

  it("returns null on wrong password", async () => {
    mockFindUnique.mockResolvedValue({ ...activeUser, passwordHash: "$2a$12$wrong" });
    expect(await authorize({ email: "alice@example.com", password: "pw" })).toBeNull();
  });

  it("returns null for DISABLED user", async () => {
    mockFindUnique.mockResolvedValue({ ...activeUser, status: "DISABLED" });
    expect(await authorize({ email: "alice@example.com", password: "pw" })).toBeNull();
  });

  it("returns null for user with no passwordHash", async () => {
    mockFindUnique.mockResolvedValue({ ...activeUser, passwordHash: null });
    expect(await authorize({ email: "alice@example.com", password: "pw" })).toBeNull();
  });

  it("returns null when user not found and auto-create is disabled", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await authorize({ email: "new@example.com", password: "pw" })).toBeNull();
  });

  it("auto-creates user when PRISM_ALLOW_USER_CREATE is true", async () => {
    vi.stubEnv("PRISM_ALLOW_USER_CREATE", "true");
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "u-new", email: "new@example.com", role: "POWER_USER" });

    const result = await authorize({ email: "new@example.com", password: "pw" });
    expect(result).toEqual({ id: "u-new", email: "new@example.com", role: "POWER_USER" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "new@example.com" }),
      }),
    );
  });
});

// ──── JWT callback ────────────────────────────────────

describe("jwt callback", () => {
  it("copies user fields into token on sign-in", async () => {
    const token = await jwtCallback({
      token: { sub: "old" },
      user: { id: "u1", role: "ADMIN" },
    } as never);
    expect(token.sub).toBe("u1");
    expect(token.role).toBe("ADMIN");
  });

  it("hydrates role from DB when missing on subsequent requests", async () => {
    mockFindUnique.mockResolvedValue({ role: "POWER_USER" });
    const token = await jwtCallback({
      token: { sub: "u1" },
    } as never);
    expect(token.role).toBe("POWER_USER");
  });
});

// ──── Session callback ────────────────────────────────

describe("session callback", () => {
  it("populates session.user with id and role from token", async () => {
    const session = { user: { id: undefined, role: undefined } };
    const token = { sub: "u1", role: "ADMIN" };
    const result = await sessionCallback({ session, token } as never);
    expect(result.user.id).toBe("u1");
    expect(result.user.role).toBe("ADMIN");
  });
});

// ──── Events ──────────────────────────────────────────

describe("events", () => {
  it("signIn event calls auditLog", async () => {
    await signInEvent({ user: { id: "u1" }, account: { provider: "credentials" } } as never);
    const { auditLog } = await import("@/server/audit/auditLogger");
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: "u1", eventType: "auth.sign_in" }),
    );
  });

  it("signOut event calls auditLog", async () => {
    await signOutEvent({ token: { sub: "u1" } } as never);
    const { auditLog } = await import("@/server/audit/auditLogger");
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: "u1", eventType: "auth.sign_out" }),
    );
  });

  it("signIn event swallows audit errors", async () => {
    const { auditLog } = await import("@/server/audit/auditLogger");
    vi.mocked(auditLog).mockRejectedValueOnce(new Error("boom"));
    // Should not throw
    await expect(
      signInEvent({ user: { id: "u1" }, account: { provider: "credentials" } } as never),
    ).resolves.toBeUndefined();
  });

  it("signIn event is a no-op when user id is missing", async () => {
    const { auditLog } = await import("@/server/audit/auditLogger");
    vi.mocked(auditLog).mockClear();
    await signInEvent({ user: {}, account: {} } as never);
    expect(auditLog).not.toHaveBeenCalled();
  });
});
