import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { Header } from "@/components/Header";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!category) notFound();

  return (
    <>
      <Header title={category.name} showBack />
      <main className="px-4">
        {category.products.length === 0 ? (
          <div className="card mt-2 p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
            В этой категории пока нет товаров.
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-3">
            {category.products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  oldPrice: p.oldPrice,
                  salePrice: p.salePrice,
                  saleBadge: p.saleBadge,
                  isSale: p.isSale,
                  currency: p.currency,
                  imageUrl: p.imageUrl,
                  inStock: p.inStock,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
