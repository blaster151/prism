import { NextResponse } from "next/server";

import { getTestNoopJobStatus } from "@/server/jobs/testNoopQueue";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const status = await getTestNoopJobStatus(id);
  if (!status) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Job not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: status });
}

