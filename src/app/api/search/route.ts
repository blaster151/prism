import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";
import { hybridSearch } from "@/server/search/hybridSearch";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query must not be empty.").max(2000),
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

    const { results } = await hybridSearch({
      query: parsed.query,
      filters: parsed.filters,
      limit: parsed.limit,
    });

    // Audit log — non-sensitive metadata only (never raw query text)
    await auditLog({
      actorUserId: session?.user?.id,
      eventType: AuditEventTypes.SearchQuery,
      entityType: "search",
      metadata: {
        queryLength: parsed.query.length,
        resultCount: results.length,
        lifecycleFilter: parsed.filters?.lifecycleState ?? "ACTIVE",
        limit: parsed.limit,
      },
    });

    return NextResponse.json({
      data: {
        results,
        resultCount: results.length,
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
