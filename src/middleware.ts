import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/adminSession";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)"],
};

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

function applyFreshBuildHeaders(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64UrlJson(value: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as Record<string, unknown>;
}

async function verifyAdminSessionEdge(token: string | undefined) {
  if (!token) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) return false;

  try {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart) return false;

    const header = decodeBase64UrlJson(headerPart);
    if (header.alg !== "HS256") return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );
    if (!verified) return false;

    const payload = decodeBase64UrlJson(payloadPart);
    if (payload.role !== "admin") return false;
    if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (req.headers.has("next-action")) {
    return applyFreshBuildHeaders(
      NextResponse.json(
        { error: "stale_client_build", reload: true },
        { status: 409 },
      ),
    );
  }

  if (!pathname.startsWith("/admin") || PUBLIC_ADMIN_PATHS.has(pathname)) {
    return applyFreshBuildHeaders(NextResponse.next());
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminSessionEdge(token);
  if (ok) return applyFreshBuildHeaders(NextResponse.next());

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return applyFreshBuildHeaders(NextResponse.redirect(loginUrl));
}
