import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Save an uploaded image to Vercel Blob and return its public URL.
 * The admin UI persists this URL to product/category imageUrl fields.
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid_form" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "blob_token_missing" }, { status: 500 });
  }

  const ext = EXT_BY_TYPE[file.type] ?? "bin";
  const originalName = file.name.replace(/\.[^.]+$/, "");
  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const pathname = `admin-images/${Date.now()}-${safeName || "image"}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
    token,
  });

  return NextResponse.json({ url: blob.url });
}
