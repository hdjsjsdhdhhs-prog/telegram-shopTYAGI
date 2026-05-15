import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const rawStatus = url.searchParams.get("status")?.toUpperCase();
  const status =
    rawStatus === "PENDING" || rawStatus === "COMPLETED" || rawStatus === "CANCELLED"
      ? rawStatus
      : null;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true, user: true },
    take: 200,
  });
  return NextResponse.json({ orders });
}
