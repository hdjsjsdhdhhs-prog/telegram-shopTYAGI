import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, ADMIN_SESSION_TTL_SECONDS } from "@/lib/adminSession";

export { ADMIN_COOKIE } from "@/lib/adminSession";

function secret(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set to a string of at least 16 characters",
    );
  }
  return new TextEncoder().encode(s);
}

export async function createAdminSession(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}
