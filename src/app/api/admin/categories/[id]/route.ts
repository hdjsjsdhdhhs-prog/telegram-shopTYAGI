import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

const UpdateBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(140).optional(),
  imageUrl: z.string().trim().max(2048).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = UpdateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ category: updated });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
