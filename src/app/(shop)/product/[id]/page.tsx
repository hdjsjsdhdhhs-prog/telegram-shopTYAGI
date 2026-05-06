import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { formatPrice } from "@/lib/format";
import { ProductActions } from "./ProductActions";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) notFound();

  return (
    <>
      <Header showBack />
      <main className="px-4">
        <div className="card overflow-hidden">
          <div className="relative aspect-square w-full bg-[color:var(--tg-bg-3)]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="100vw"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[color:var(--tg-text-muted)]">
                <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.4}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="text-xs text-[color:var(--tg-text-muted)]">
              {product.category.name}
            </div>
            <h1 className="mt-1 text-xl font-semibold leading-tight">
              {product.name}
            </h1>
            <div className="mt-3 text-2xl font-bold">
              {formatPrice(product.price, product.currency)}
            </div>
            {product.description ? (
              <p className="mt-3 whitespace-pre-line text-sm text-[color:var(--tg-text-muted)]">
                {product.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-24 z-10 mt-4">
          <ProductActions
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              currency: product.currency,
              imageUrl: product.imageUrl,
              inStock: product.inStock,
            }}
          />
        </div>
      </main>
    </>
  );
}
