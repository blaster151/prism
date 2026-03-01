import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import {
  getCandidateRecord,
  updateCandidateRecord,
} from "@/server/records/dataRecordService";

const PatchSchema = z
  .object({
    fullName: z.string().max(200).optional(),
    title: z.string().max(200).optional(),
    email: z.string().max(320).optional(),
    phone: z.string().max(50).optional(),
  })
  .strict();

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await ctx.params;
    const record = await getCandidateRecord({ user: session?.user, candidateId: id });
    if (!record) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Candidate not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: record });
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await ctx.params;
    const patch = PatchSchema.parse(await req.json());

    const result = await updateCandidateRecord({
      user: session?.user,
      candidateId: id,
      patch,
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
        { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error." } },
      { status: 500 },
    );
  }
}

