import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTelegramUserFromHeaders } from "@/lib/telegramAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getTelegramUserFromHeaders();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });
  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      deliveryMethod: order.deliveryMethod,
      address: order.address,
      comment: order.comment,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitSalePrice ?? item.unitPrice,
        quantity: item.quantity,
      })),
    })),
  });
}
