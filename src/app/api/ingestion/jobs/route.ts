import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { listRecentIngestionJobs } from "@/server/ingestion/ingestionJobsService";

const QuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const q = QuerySchema.safeParse({
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!q.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid query params." } },
        { status: 400 },
      );
    }

    const jobs = await listRecentIngestionJobs({ session, limit: q.data.limit });
    return NextResponse.json({ data: { jobs } });
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.httpStatus },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error." } },
      { status: 500 },
    );
  }
}

