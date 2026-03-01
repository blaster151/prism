import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { getOcrQueueSingleton } from "@/server/ocr/ocrQueue";

const BodySchema = z
  .object({
    resumeDocumentId: z.string().min(1),
    pdfBase64: z.string().min(1),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireRole({ user: session?.user, requiredRole: UserRole.POWER_USER });

    const body = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
        { status: 400 },
      );
    }

    const exists = await prisma.resumeDocument.findUnique({
      where: { id: body.data.resumeDocumentId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "ResumeDocument not found." } },
        { status: 404 },
      );
    }

    const queue = getOcrQueueSingleton();
    const job = await queue.add("ocr", {
      resumeDocumentId: body.data.resumeDocumentId,
      pdfBase64: body.data.pdfBase64,
    });
    return NextResponse.json({ data: { jobId: job.id } });
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

