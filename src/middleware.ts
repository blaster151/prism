import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPrefixes = ["/auth/signin", "/api/auth", "/api/health", "/api/internal"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const signIn = new URL("/auth/signin", req.url);
  signIn.searchParams.set("callbackUrl", req.nextUrl.href);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

