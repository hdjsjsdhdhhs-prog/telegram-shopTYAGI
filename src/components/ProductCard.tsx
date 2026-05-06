"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  inStock?: boolean;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="card overflow-hidden flex flex-col animate-fade-up">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square w-full bg-[color:var(--tg-bg-3)]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 480px) 50vw, 240px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[color:var(--tg-text-muted)]">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/product/${product.id}`} className="line-clamp-2 text-sm font-medium leading-snug">
          {product.name}
        </Link>
        <div className="mt-2 flex-1" />
        <div className="mt-1 text-base font-semibold">
          {formatPrice(product.price, product.currency)}
        </div>
        <button
          onClick={() => {
            startTransition(() => {
              add({
                id: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                imageUrl: product.imageUrl ?? null,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1100);
              try {
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
              } catch {
                /* ignore */
              }
            });
          }}
          disabled={product.inStock === false}
          className={`mt-2 inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98] ${
            added
              ? "bg-emerald-500 text-white"
              : "bg-[color:var(--tg-bg-3)] text-white hover:bg-blue-500"
          } disabled:opacity-50 disabled:pointer-events-none`}
        >
          {product.inStock === false
            ? "Нет в наличии"
            : added
              ? "Добавлено"
              : "В корзину"}
        </button>
      </div>
    </div>
  );
}
