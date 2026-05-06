import { prisma } from "@/lib/prisma";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
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
            Новинки
          </h2>
          {products.length === 0 ? (
            <div className="card mt-2 p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
              Пока нет товаров. Добавьте их в админ-панели.
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    currency: p.currency,
                    imageUrl: p.imageUrl,
                    inStock: p.inStock,
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
