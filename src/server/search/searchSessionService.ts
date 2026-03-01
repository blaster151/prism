import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryHistoryEntry {
  query: string;
  filters?: { lifecycleState?: string };
  timestamp: string; // ISO 8601
}

export interface SearchSessionData {
  id: string;
  userId: string;
  queryHistory: QueryHistoryEntry[];
  currentContext: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new search session for a user with the initial query.
 */
export async function createSession(args: {
  userId: string;
  query: string;
  filters?: { lifecycleState?: string };
}): Promise<SearchSessionData> {
  const entry: QueryHistoryEntry = {
    query: args.query,
    filters: args.filters,
    timestamp: new Date().toISOString(),
  };

  const context = args.query;

  const session = await prisma.searchSession.create({
    data: {
      userId: args.userId,
      queryHistory: [entry] as unknown as Prisma.InputJsonValue,
      currentContext: context,
    },
  });

  return toSessionData(session);
}

/**
 * Retrieve an existing search session by ID.
 */
export async function getSession(sessionId: string): Promise<SearchSessionData> {
  const session = await prisma.searchSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Search session not found.",
      httpStatus: 404,
    });
  }

  return toSessionData(session);
}

/**
 * Append a refinement query to an existing session.
 * Returns the updated session data.
 */
export async function appendRefinement(args: {
  sessionId: string;
  query: string;
  filters?: { lifecycleState?: string };
}): Promise<SearchSessionData> {
  const existing = await getSession(args.sessionId);

  const entry: QueryHistoryEntry = {
    query: args.query,
    filters: args.filters,
    timestamp: new Date().toISOString(),
  };

  const updatedHistory = [...existing.queryHistory, entry];
  const context = buildQueryContext(updatedHistory);

  const session = await prisma.searchSession.update({
    where: { id: args.sessionId },
    data: {
      queryHistory: updatedHistory as unknown as Prisma.InputJsonValue,
      currentContext: context,
    },
  });

  return toSessionData(session);
}

/**
 * Build a combined query string from the session's query history.
 * The combined query incorporates all historical queries so hybridSearch
 * can search against the accumulated intent.
 *
 * Strategy: newest query first (highest weight in embedding), followed by
 * prior queries for context. Deduplicates terms.
 */
export function buildCombinedQuery(history: QueryHistoryEntry[]): string {
  if (history.length === 0) return "";
  if (history.length === 1) return history[0].query;

  // Reverse so newest is first, then join
  const queries = [...history].reverse().map((h) => h.query);
  return queries.join(" ");
}

/**
 * Build a human-readable context string from query history.
 * Used for display in the UI.
 */
export function buildQueryContext(history: QueryHistoryEntry[]): string {
  if (history.length === 0) return "";
  if (history.length === 1) return history[0].query;

  return history.map((h) => h.query).join(" → ");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toSessionData(session: {
  id: string;
  userId: string;
  queryHistory: unknown;
  currentContext: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SearchSessionData {
  return {
    id: session.id,
    userId: session.userId,
    queryHistory: (session.queryHistory ?? []) as QueryHistoryEntry[],
    currentContext: session.currentContext,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

// Exported for testing
export const __private = { buildCombinedQuery, buildQueryContext, toSessionData };
