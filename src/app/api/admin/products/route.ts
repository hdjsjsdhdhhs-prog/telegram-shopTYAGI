import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

const CreateBody = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  price: z.number().int().min(0).max(100_000_000), // minor units
  costPrice: z.number().int().min(0).max(100_000_000).optional(),
  oldPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
  salePrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
  saleBadge: z.string().trim().max(40).nullable().optional(),
  isSale: z.boolean().optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  imageUrl: z.string().trim().max(2048).nullable().optional(),
  categoryId: z.string().trim().min(1),
  inStock: z.boolean().optional(),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }
  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "category_not_found" }, { status: 400 });
  }
  const created = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      costPrice: parsed.data.costPrice ?? 0,
      oldPrice: parsed.data.oldPrice ?? null,
      salePrice: parsed.data.salePrice ?? null,
      saleBadge: parsed.data.saleBadge || null,
      isSale: parsed.data.isSale ?? false,
      currency: parsed.data.currency || "RUB",
      imageUrl: parsed.data.imageUrl || null,
      inStock: parsed.data.inStock ?? true,
      categoryId: parsed.data.categoryId,
    },
  });
  return NextResponse.json({ product: created });
}
