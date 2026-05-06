import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTelegramUserFromHeaders } from "@/lib/telegramAuth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getTelegramUserFromHeaders();
  if (!user) return NextResponse.json({ favorite: false });
  const exists = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId: id } },
  });
  return NextResponse.json({ favorite: Boolean(exists) });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getTelegramUserFromHeaders();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.favorite.upsert({
    where: { userId_productId: { userId: user.id, productId: id } },
    create: { userId: user.id, productId: id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getTelegramUserFromHeaders();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.favorite
    .delete({
      where: { userId_productId: { userId: user.id, productId: id } },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
