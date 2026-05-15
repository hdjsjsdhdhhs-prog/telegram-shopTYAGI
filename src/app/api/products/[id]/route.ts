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
  stockQuantity: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      sortOrder: true,
    },
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: publicProductSelect,
  });
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ product });
}
