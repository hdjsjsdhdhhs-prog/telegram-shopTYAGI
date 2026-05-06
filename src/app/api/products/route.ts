import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const ids = url.searchParams.get("ids");

  const where = ids
    ? { id: { in: ids.split(",").filter(Boolean) } }
    : categoryId
      ? { categoryId }
      : undefined;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}
