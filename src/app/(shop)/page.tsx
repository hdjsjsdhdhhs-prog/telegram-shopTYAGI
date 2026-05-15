import { prisma } from "@/lib/prisma";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, saleProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({
      where: { isSale: true, stockQuantity: { gt: 0 } },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
  ]);

  return (
    <>
      <Header />
      <main className="px-4">
        <section>
          <h2 className="mt-2 text-sm font-semibold uppercase tracking-wider text-[color:var(--tg-text-muted)]">
            Категории
          </h2>
          <CategoryGrid
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              imageUrl: c.imageUrl,
            }))}
          />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--tg-text-muted)]">
            Распродажа
          </h2>
          {saleProducts.length === 0 ? (
            <div className="card mt-2 p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
              Пока нет товаров в распродаже.
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {saleProducts.map((p) => (
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
                    stockQuantity: p.stockQuantity,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
