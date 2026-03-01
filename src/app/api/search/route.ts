import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";
import { hybridSearch } from "@/server/search/hybridSearch";
import { explainResults } from "@/server/search/explainService";
import {
  createSession,
  getSession,
  appendRefinement,
  buildCombinedQuery,
} from "@/server/search/searchSessionService";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query must not be empty.").max(2000),
  sessionId: z.string().uuid().optional(),
  filters: z
    .object({
      lifecycleState: z.enum(["ACTIVE", "ARCHIVE"]).optional(),
    })
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ---------------------------------------------------------------------------
// POST /api/search
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireRole({ user: session?.user, requiredRole: UserRole.POWER_USER });

    const body: unknown = await req.json();
    const parsed = SearchRequestSchema.parse(body);

    const userId = session?.user?.id;

    // --- Session management ---
    let searchSession;
    let isRefinement = false;

    if (parsed.sessionId) {
      // Refinement: append to existing session
      searchSession = await appendRefinement({
        sessionId: parsed.sessionId,
        query: parsed.query,
        filters: parsed.filters,
      });
      isRefinement = true;
    } else if (userId) {
      // New search: create session
      searchSession = await createSession({
        userId,
        query: parsed.query,
        filters: parsed.filters,
      });
    }

    // Build combined query from session history (or use raw query if no session)
    const effectiveQuery = searchSession
      ? buildCombinedQuery(searchSession.queryHistory)
      : parsed.query;

    const { results: rawResults } = await hybridSearch({
      query: effectiveQuery,
      filters: parsed.filters,
      limit: parsed.limit,
    });

    // Generate grounded explanations for each result
    const results = await explainResults({
      query: effectiveQuery,
      results: rawResults,
    });

    // Audit log — non-sensitive metadata only (never raw query text)
    await auditLog({
      actorUserId: userId,
      eventType: isRefinement
        ? AuditEventTypes.SearchRefine
        : AuditEventTypes.SearchQuery,
      entityType: "search",
      metadata: {
        queryLength: parsed.query.length,
        resultCount: results.length,
        lifecycleFilter: parsed.filters?.lifecycleState ?? "ACTIVE",
        limit: parsed.limit,
        sessionId: searchSession?.id ?? null,
        isRefinement,
        historyLength: searchSession?.queryHistory.length ?? 1,
      },
    });

    // Audit log explanation generation (non-sensitive metadata only)
    await auditLog({
      actorUserId: userId,
      eventType: AuditEventTypes.SearchExplain,
      entityType: "search",
      metadata: {
        candidateCount: results.length,
        evidenceCounts: results.map((r) => r.explanation?.evidence.length ?? 0),
      },
    });

    return NextResponse.json({
      data: {
        results,
        resultCount: results.length,
        sessionId: searchSession?.id ?? null,
        queryContext: searchSession?.currentContext ?? parsed.query,
      },
    });
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.httpStatus },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid search request.", details: { issues: err.issues } } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error." } },
      { status: 500 },
    );
  }
}
