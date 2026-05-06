import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminSession(token);
  if (ok) return NextResponse.next();
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}
