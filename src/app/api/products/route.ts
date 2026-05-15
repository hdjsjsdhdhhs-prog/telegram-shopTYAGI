import { NextResponse } from "next/server";
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

  const where = ids
    ? { id: { in: ids.split(",").filter(Boolean) } }
    : categoryId
      ? { categoryId, ...(saleOnly ? { isSale: true } : {}) }
      : saleOnly
        ? { isSale: true }
        : undefined;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: publicProductSelect,
  });
  return NextResponse.json({ products });
}
