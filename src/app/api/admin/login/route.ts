import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions, createAdminSession } from "@/lib/auth";

const Body = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) {
    return NextResponse.json(
      { error: "admin_password_not_configured" },
      { status: 500 },
    );
  }
  if (parsed.data.password !== expected) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  const token = await createAdminSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}
