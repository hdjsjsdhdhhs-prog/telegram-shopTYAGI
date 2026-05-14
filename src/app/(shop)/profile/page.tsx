"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useTelegram, useTelegramHeaders } from "@/components/TelegramProvider";
import { formatPrice } from "@/lib/format";
import { getProductDisplayPrice, getProductOldPrice, getProductSaleBadge } from "@/lib/pricing";

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  items: { id: string; productName: string; quantity: number }[];
}
interface FavoriteSummary {
  id: string;
  name: string;
  price: number;
  oldPrice: number | null;
  salePrice: number | null;
  saleBadge: string | null;
  isSale: boolean;
  currency: string;
  imageUrl: string | null;
}

export default function ProfilePage() {
  const { user, ready, isInTelegram } = useTelegram();
  const headers = useTelegramHeaders();
  const [tab, setTab] = useState<"orders" | "favorites">("orders");
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [favorites, setFavorites] = useState<FavoriteSummary[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetch("/api/orders", { headers })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((j) => setOrders(j.orders ?? []))
      .catch(() => setOrders([]));
    fetch("/api/favorites", { headers })
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then((j) => setFavorites(j.favorites ?? []))
      .catch(() => setFavorites([]));
  }, [ready, headers]);

  return (
    <>
      <Header />
      <main className="px-4">
        <div className="card mt-2 flex items-center gap-3 p-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[color:var(--tg-bg-3)]">
            {user?.photo_url ? (
              <Image src={user.photo_url} alt="avatar" fill sizes="56px" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold">
                {(user?.first_name ?? "U").slice(0, 1)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold">
              {user
                ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Гость"
                : "Гость"}
            </div>
            <div className="text-xs text-[color:var(--tg-text-muted)]">
              {user?.username ? `@${user.username}` : isInTelegram ? "Telegram" : "Demo режим"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[color:var(--tg-bg-2)] p-1">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
            Заказы
          </TabButton>
          <TabButton active={tab === "favorites"} onClick={() => setTab("favorites")}>
            Избранное
          </TabButton>
        </div>

        <div className="mt-3">
          {tab === "orders" ? (
            <OrdersList orders={orders} />
          ) : (
            <FavoritesList favorites={favorites} />
          )}
        </div>
      </main>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-2 text-sm font-medium transition-colors ${
        active ? "bg-[color:var(--tg-bg-3)] text-white" : "text-[color:var(--tg-text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function OrdersList({ orders }: { orders: OrderSummary[] | null }) {
  if (orders === null) return <Skeleton />;
  if (orders.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
        У вас пока нет заказов.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {orders.map((o) => (
        <li key={o.id} className="card p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Заказ #{o.id.slice(-6)}</span>
            <StatusBadge status={o.status} />
          </div>
          <div className="mt-1 text-xs text-[color:var(--tg-text-muted)]">
            {new Date(o.createdAt).toLocaleString("ru-RU")}
          </div>
          <ul className="mt-2 space-y-0.5 text-sm">
            {o.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span className="truncate pr-2">{it.productName}</span>
                <span className="text-[color:var(--tg-text-muted)]">×{it.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-sm">
            <span className="text-[color:var(--tg-text-muted)]">Итого</span>
            <span className="font-semibold">{formatPrice(o.total, o.currency)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FavoritesList({ favorites }: { favorites: FavoriteSummary[] | null }) {
  if (favorites === null) return <Skeleton />;
  if (favorites.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
        Избранное пусто. Добавляйте товары с карточки.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {favorites.map((p) => {
        const oldPrice = getProductOldPrice(p);
        const saleBadge = getProductSaleBadge(p);

        return (
          <Link href={`/product/${p.id}`} key={p.id} className="card overflow-hidden">
            <div className="relative aspect-square w-full bg-[color:var(--tg-bg-3)]">
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt={p.name} fill sizes="50vw" className="object-cover" unoptimized />
              ) : null}
              {saleBadge ? (
                <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-rose-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {saleBadge}
                </span>
              ) : null}
            </div>
            <div className="p-3">
              <div className="line-clamp-2 text-sm">{p.name}</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className={`text-base font-semibold ${p.isSale && p.salePrice != null ? "text-rose-300" : ""}`}>
                  {formatPrice(getProductDisplayPrice(p), p.currency)}
                </span>
                {oldPrice ? (
                  <span className="text-xs text-[color:var(--tg-text-muted)] line-through">
                    {formatPrice(oldPrice, p.currency)}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "В обработке", className: "bg-amber-500/15 text-amber-400" },
    COMPLETED: { label: "Выполнен", className: "bg-emerald-500/15 text-emerald-400" },
    CANCELLED: { label: "Отменен", className: "bg-rose-500/15 text-rose-400" },
  };
  const v = map[status] ?? map.PENDING;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.className}`}>
      {v.label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-20 animate-pulse" />
      ))}
    </div>
  );
}
