import { NextResponse } from "next/server";
import { z } from "zod";

import { isAppError } from "@/lib/errors";
import { runExtractionForResumeDocument } from "@/server/extract/extractService";

const BodySchema = z
  .object({
    resumeDocumentId: z.string().min(1),
  })
  .strict();

function requireInternalToken(req: Request) {
  const expected = process.env.PRISM_INTERNAL_WORKER_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: { code: "MISCONFIGURED", message: "Internal token not set." } },
      { status: 500 },
    );
  }
  const got = req.headers.get("x-prism-internal-token");
  if (!got || got !== expected) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Forbidden." } },
      { status: 403 },
    );
  }
  return null;
}

export async function POST(req: Request) {
  const tokenErr = requireInternalToken(req);
  if (tokenErr) return tokenErr;

  try {
    const body = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
        { status: 400 },
      );
    }

    const res = await runExtractionForResumeDocument({
      session: null,
      resumeDocumentId: body.data.resumeDocumentId,
    });
    return NextResponse.json({ data: res });
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

