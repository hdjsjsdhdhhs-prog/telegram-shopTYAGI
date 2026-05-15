import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";
import { calculateOrderFinancials } from "@/lib/profit";

const Body = z.object({
  status: z.preprocess(
    (value) => (typeof value === "string" ? value.toUpperCase() : value),
    z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
  ),
});

class InsufficientStockError extends Error {}

function aggregateOrderItems(
  items: { productId: string; productName: string; quantity: number }[],
) {
  const byProduct = new Map<
    string,
    { productId: string; productName: string; quantity: number }
  >();

  for (const item of items) {
    const existing = byProduct.get(item.productId);
    byProduct.set(item.productId, {
      productId: item.productId,
      productName: existing?.productName ?? item.productName,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  return Array.from(byProduct.values());
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!current) {
        return null;
      }

      const nextStatus = parsed.data.status;
      const isCompleting =
        nextStatus === "COMPLETED" && current.status !== "COMPLETED";
      const isUndoingCompletion =
        nextStatus !== "COMPLETED" && current.status === "COMPLETED";
      const orderItems = aggregateOrderItems(current.items);

      if (isCompleting) {
        for (const item of orderItems) {
          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
              inStock: true,
            },
          });

          if (updated.count !== 1) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockQuantity: true },
            });
            throw new InsufficientStockError(
              `Недостаточно товара "${item.productName}" на складе. Доступно: ${product?.stockQuantity ?? 0}, в заказе: ${item.quantity}.`,
            );
          }

          await tx.product.updateMany({
            where: { id: item.productId, stockQuantity: 0 },
            data: { inStock: false },
          });
        }
      }

      if (isUndoingCompletion) {
        for (const item of orderItems) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
              inStock: true,
            },
          });
        }
      }

      const financials = calculateOrderFinancials(current.items);
      const data =
        nextStatus === "COMPLETED"
          ? {
              status: nextStatus,
              revenue: financials.revenue,
              cost: financials.cost,
              profit: financials.profit,
              completedAt: current.completedAt ?? new Date(),
            }
          : {
              status: nextStatus,
              revenue: 0,
              cost: 0,
              profit: 0,
              completedAt: null,
            };

      return tx.order.update({
        where: { id },
        data,
        include: { user: true },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Optional notification to the user when status changes.
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (botToken && order.user?.telegramId) {
    const labels: Record<string, string> = {
      PENDING: "ожидает обработки",
      COMPLETED: "выполнен",
      CANCELLED: "отменён",
    };
    const text =
      `Статус заказа <code>#${order.id.slice(-6)}</code>: <b>${labels[order.status]}</b>`;
    await sendTelegramMessage(botToken, order.user.telegramId, text);
  }

  return NextResponse.json({ order });
}
