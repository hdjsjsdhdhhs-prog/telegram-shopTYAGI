import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { slugify } from "@/lib/format";

const CreateBody = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(140).optional(),
  imageUrl: z.string().trim().max(2048).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const baseSlug = slugify(parsed.data.slug || parsed.data.name) || `c-${Date.now()}`;
  let slug = baseSlug;
  for (let i = 1; ; i++) {
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }
  const created = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      imageUrl: parsed.data.imageUrl || null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });
  return NextResponse.json({ category: created });
}
