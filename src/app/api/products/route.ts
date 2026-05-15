import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const publicProductSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  oldPrice: true,
  salePrice: true,
  saleBadge: true,
  isSale: true,
  currency: true,
  imageUrl: true,
  inStock: true,
  stockQuantity: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const ids = url.searchParams.get("ids");
  const saleParam = url.searchParams.get("sale");
  const saleOnly = saleParam === "1" || saleParam === "true";
  const query = url.searchParams.get("q")?.trim();

  const where: Prisma.ProductWhereInput = { stockQuantity: { gt: 0 } };
  if (ids) {
    where.id = { in: ids.split(",").filter(Boolean) };
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (saleOnly) {
    where.isSale = true;
  }
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: publicProductSelect,
  });
  return NextResponse.json({ products });
}
