import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTelegramUserFromHeaders } from "@/lib/telegramAuth";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram";
import { formatPrice } from "@/lib/format";
import { getProductDisplayPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const OrderInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(100),
  paymentMethod: z.enum(["CASH", "CARD", "CRYPTO"]),
  deliveryMethod: z.enum(["COURIER", "PICKUP"]),
  address: z.string().trim().max(500).nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional(),
});

function aggregateItems(items: z.infer<typeof OrderInput>["items"]) {
  const byProduct = new Map<string, number>();

  for (const item of items) {
    byProduct.set(
      item.productId,
      (byProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  return Array.from(byProduct.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function insufficientStockMessage(productName: string, available: number, requested: number) {
  return `Недостаточно товара "${productName}" на складе. Доступно: ${available}, в заказе: ${requested}.`;
}

export async function POST(req: Request) {
  const user = await getTelegramUserFromHeaders();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = OrderInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.deliveryMethod === "COURIER" && !parsed.data.address) {
    return NextResponse.json({ error: "address_required" }, { status: 400 });
  }

  const requestedItems = aggregateItems(parsed.data.items);
  const ids = requestedItems.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  if (products.length !== ids.length) {
    return NextResponse.json(
      { error: "Один из товаров больше недоступен." },
      { status: 400 },
    );
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of requestedItems) {
    const product = productMap.get(item.productId);
    if (!product || product.stockQuantity < item.quantity) {
      return NextResponse.json(
        {
          error: insufficientStockMessage(
            product?.name ?? "Товар",
            product?.stockQuantity ?? 0,
            item.quantity,
          ),
        },
        { status: 409 },
      );
    }
  }

  let total = 0;
  const itemsCreate = requestedItems
    .map((i) => {
      const p = productMap.get(i.productId);
      if (!p) return null;
      const unitPrice = getProductDisplayPrice(p);
      total += unitPrice * i.quantity;
      return {
        productId: p.id,
        productName: p.name,
        unitPrice,
        unitSalePrice: unitPrice,
        unitCostPrice: p.costPrice,
        quantity: i.quantity,
      };
    })
    .filter(Boolean) as {
    productId: string;
    productName: string;
    unitPrice: number;
    unitSalePrice: number;
    unitCostPrice: number;
    quantity: number;
  }[];

  if (itemsCreate.length === 0) {
    return NextResponse.json({ error: "no_valid_items" }, { status: 400 });
  }

  const currency = products[0].currency || "RUB";

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      paymentMethod: parsed.data.paymentMethod,
      deliveryMethod: parsed.data.deliveryMethod,
      address: parsed.data.address ?? null,
      comment: parsed.data.comment ?? null,
      total,
      currency,
      items: { create: itemsCreate },
    },
    include: { items: true },
  });

  // Telegram notifications (best-effort, never fail the order).
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const adminChatId = process.env.ADMIN_CHAT_ID || "";

  const safeUsername = user.username ? `@${escapeHtml(user.username)}` : "—";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const itemsText = order.items
    .map(
      (it) =>
        `• ${escapeHtml(it.productName)} × ${it.quantity} — ${formatPrice(it.unitPrice * it.quantity, currency)}`,
    )
    .join("\n");
  const paymentLabel: Record<string, string> = {
    CASH: "Наличные",
    CARD: "Карта",
    CRYPTO: "Криптовалюта",
  };
  const deliveryLabel: Record<string, string> = {
    COURIER: "Курьер",
    PICKUP: "Самовывоз",
  };

  const adminText = [
    `<b>🛒 Новый заказ #${order.id.slice(-6)}</b>`,
    "",
    `<b>Клиент:</b> ${escapeHtml(fullName) || "—"} ${safeUsername}`,
    `<b>Telegram ID:</b> <code>${user.telegramId}</code>`,
    `<b>Оплата:</b> ${paymentLabel[order.paymentMethod] ?? order.paymentMethod}`,
    `<b>Доставка:</b> ${deliveryLabel[order.deliveryMethod] ?? order.deliveryMethod}`,
    order.address ? `<b>Адрес:</b> ${escapeHtml(order.address)}` : "",
    order.comment ? `<b>Комментарий:</b> ${escapeHtml(order.comment)}` : "",
    "",
    "<b>Состав:</b>",
    itemsText,
    "",
    `<b>Итого:</b> ${formatPrice(order.total, currency)}`,
    `<b>Дата:</b> ${new Date(order.createdAt).toLocaleString("ru-RU")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const userText =
    "✅ <b>Ваш заказ успешно оформлен!</b>\n\n" +
    `Номер: <code>#${order.id.slice(-6)}</code>\n` +
    `Сумма: ${formatPrice(order.total, currency)}\n\n` +
    "Мы свяжемся с вами для подтверждения.";

  const tasks: Promise<void>[] = [];
  if (botToken && adminChatId) {
    tasks.push(sendTelegramMessage(botToken, adminChatId, adminText));
  }
  if (botToken) {
    tasks.push(sendTelegramMessage(botToken, user.telegramId, userText));
  }
  // Fire-and-forget but await with timeout-friendly behavior
  await Promise.allSettled(tasks);

  return NextResponse.json({ ok: true, orderId: order.id });
}
