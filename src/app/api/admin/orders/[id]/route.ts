import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

const Body = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
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
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  let order;
  try {
    order = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { user: true },
    });
  } catch {
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
