import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const Body = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

/**
 * Re-hydrate the client-side cart against the latest server-side product
 * data (price, name, availability). The cart itself is stored in
 * localStorage on the client, but pricing and availability must always be
 * trusted from the server.
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.ids } },
  });
  return NextResponse.json({ products });
}
