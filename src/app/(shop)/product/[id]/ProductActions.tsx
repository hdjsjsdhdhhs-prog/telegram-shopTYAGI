"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useTelegram, useTelegramHeaders } from "@/components/TelegramProvider";
import { useFavorite } from "@/components/useFavorite";
import { getProductDisplayPrice } from "@/lib/pricing";

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    oldPrice?: number | null;
    salePrice?: number | null;
    saleBadge?: string | null;
    isSale?: boolean | null;
    currency: string;
    imageUrl?: string | null;
    inStock: boolean;
  };
}

export function ProductActions({ product }: Props) {
  const { add } = useCart();
  const { ready } = useTelegram();
  const headers = useTelegramHeaders();
  const { isFavorite, toggle, loading: favLoading } = useFavorite(product.id, headers, ready);
  const [added, setAdded] = useState(false);
  const displayPrice = getProductDisplayPrice(product);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggle()}
        disabled={favLoading}
        aria-label="В избранное"
        aria-pressed={isFavorite}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/5 transition-colors ${
          isFavorite
            ? "bg-rose-500/15 text-rose-400"
            : "bg-[color:var(--tg-bg-2)] text-white"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.35-9.5-8.5C.7 9.5 2.5 5 7 5c2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 4.5 0 6.3 4.5 4.5 7.5C19 16.65 12 21 12 21z" />
        </svg>
      </button>
      <button
        disabled={!product.inStock}
        onClick={() => {
          add({
            id: product.id,
            name: product.name,
            price: displayPrice,
            currency: product.currency,
            imageUrl: product.imageUrl ?? null,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 1200);
          try {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium");
          } catch {
            /* ignore */
          }
        }}
        className={`btn-primary ${added ? "!bg-emerald-500" : ""}`}
      >
        {added ? "Добавлено в корзину" : "Добавить в корзину"}
      </button>
    </div>
  );
}
