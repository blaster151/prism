import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { isAppError } from "@/lib/errors";
import { adminPing } from "@/server/admin/adminService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const result = await adminPing({ user: session?.user });
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

