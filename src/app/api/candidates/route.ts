import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { listCandidates } from "@/server/candidates/candidatesService";

import { CandidateLifecycleState } from "@prisma/client";

const QuerySchema = z.object({
  state: z.nativeEnum(CandidateLifecycleState).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const query = QuerySchema.parse({ state: url.searchParams.get("state") ?? undefined });

    const result = await listCandidates({
      user: session?.user,
      lifecycleState: query.state,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.httpStatus },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid query parameters." } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error." } },
      { status: 500 },
    );
  }
}

