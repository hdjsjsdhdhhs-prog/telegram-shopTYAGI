"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, setQuantity, remove, totalPrice, clear } = useCart();
  const currency = items[0]?.currency ?? "RUB";

  return (
    <>
      <Header title="Корзина" showBack />
      <main className="px-4">
        {items.length === 0 ? (
          <div className="card mt-2 p-8 text-center">
            <p className="text-base">Корзина пуста</p>
            <p className="mt-1 text-sm text-[color:var(--tg-text-muted)]">
              Добавьте товары из каталога.
            </p>
            <Link href="/" className="btn-primary mt-5">
              К каталогу
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-2 space-y-2">
              {items.map((it) => (
                <li key={it.id} className="card flex gap-3 p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[color:var(--tg-bg-3)]">
                    {it.imageUrl ? (
                      <Image
                        src={it.imageUrl}
                        alt={it.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-medium leading-snug">
                        {it.name}
                      </span>
                      <button
                        onClick={() => remove(it.id)}
                        aria-label="Удалить"
                        className="text-[color:var(--tg-text-muted)] hover:text-rose-400"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="text-base font-semibold">
                        {formatPrice(it.price * it.quantity, it.currency)}
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-[color:var(--tg-bg-3)] p-1">
                        <button
                          onClick={() => setQuantity(it.id, it.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--tg-bg-2)] text-white"
                          aria-label="Минус"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M5 12h14" />
                          </svg>
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(it.id, it.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white"
                          aria-label="Плюс"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="card mt-4 flex items-center justify-between p-4">
              <span className="text-[color:var(--tg-text-muted)]">Итого</span>
              <span className="text-xl font-bold">
                {formatPrice(totalPrice, currency)}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <Link href="/checkout" className="btn-primary">
                Продолжить
              </Link>
              <button onClick={clear} className="btn-ghost mx-auto block">
                Очистить корзину
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
