import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { setCandidateLifecycle } from "@/server/candidates/candidatesService";

import { CandidateLifecycleState } from "@prisma/client";

const BodySchema = z.object({
  lifecycleState: z.nativeEnum(CandidateLifecycleState),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await ctx.params;
    const body = BodySchema.parse(await req.json());

    const result = await setCandidateLifecycle({
      user: session?.user,
      candidateId: id,
      lifecycleState: body.lifecycleState,
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

