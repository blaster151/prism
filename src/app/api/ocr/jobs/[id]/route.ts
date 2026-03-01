import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { getOcrJobStatus } from "@/server/ocr/ocrJobsService";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await ctx.params;
    const status = await getOcrJobStatus({ session, jobId: id });
    if (!status) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: { job: status } });
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

