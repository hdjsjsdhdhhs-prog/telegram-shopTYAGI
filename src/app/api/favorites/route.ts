import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTelegramUserFromHeaders } from "@/lib/telegramAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getTelegramUserFromHeaders();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
  return NextResponse.json({
    favorites: favs.map((f) => ({
      id: f.product.id,
      name: f.product.name,
      price: f.product.price,
      oldPrice: f.product.oldPrice,
      salePrice: f.product.salePrice,
      saleBadge: f.product.saleBadge,
      isSale: f.product.isSale,
      currency: f.product.currency,
      imageUrl: f.product.imageUrl,
    })),
  });
}
