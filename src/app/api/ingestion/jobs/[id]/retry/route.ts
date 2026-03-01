import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { retryIngestionJob } from "@/server/ingestion/ingestionJobsService";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await ctx.params;
    const result = await retryIngestionJob({ session, jobId: id });
    return NextResponse.json({ data: result });
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

