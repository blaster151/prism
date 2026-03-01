import { NextResponse } from "next/server";
import { z } from "zod";

import { enqueueTestNoopJob } from "@/server/jobs/testNoopQueue";

const BodySchema = z
  .object({
    shouldFail: z.boolean().optional(),
  })
  .strict();

export async function POST(req: Request) {
  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
      { status: 400 },
    );
  }

  const result = await enqueueTestNoopJob({ shouldFail: body.data.shouldFail });
  return NextResponse.json({ data: result });
}

