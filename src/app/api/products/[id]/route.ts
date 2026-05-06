import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ product });
}
