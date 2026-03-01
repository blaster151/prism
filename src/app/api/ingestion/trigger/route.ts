import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { enqueueDropboxIngest } from "@/server/ingestion/ingestionService";

const BodySchema = z
  .object({
    dropboxPath: z.string().optional(),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
        { status: 400 },
      );
    }

    const result = await enqueueDropboxIngest({
      session,
      dropboxPath: body.data.dropboxPath,
    });
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

