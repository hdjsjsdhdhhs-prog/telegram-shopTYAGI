import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

const UpdateBody = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  price: z.number().int().min(0).max(100_000_000).optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  imageUrl: z.string().trim().max(2048).nullable().optional(),
  categoryId: z.string().trim().min(1).optional(),
  inStock: z.boolean().optional(),
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
  if (parsed.data.categoryId) {
    const exists = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!exists) {
      return NextResponse.json({ error: "category_not_found" }, { status: 400 });
    }
  }
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ product: updated });
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
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
