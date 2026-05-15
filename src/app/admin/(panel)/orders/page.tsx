"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}
interface User {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}
interface Order {
  id: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  paymentMethod: string;
  deliveryMethod: string;
  address: string | null;
  comment: string | null;
  total: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
  user: User;
}

function StatusFilter({
  current,
  onChange,
}: {
  current: string | null;
  onChange: (status: string | null) => void;
}) {
  const opts: { v: string | null; l: string }[] = [
    { v: null, l: "Все" },
    { v: "PENDING", l: "В обработке" },
    { v: "COMPLETED", l: "Выполнен" },
    { v: "CANCELLED", l: "Отменён" },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[color:var(--tg-bg-2)] p-1 no-scrollbar">
      {opts.map((o) => (
        <button
          key={o.v ?? "all"}
          onClick={() => onChange(o.v)}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium ${
            current === o.v
              ? "bg-[color:var(--tg-bg-3)] text-white"
              : "text-[color:var(--tg-text-muted)]"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function AdminOrdersInner() {
  const params = useSearchParams();
  const initialStatus = params.get("status");
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const url = status ? `/api/admin/orders?status=${status}` : `/api/admin/orders`;
    const res = await fetch(url);
    const j = await res.json();
    setOrders(j.orders ?? []);
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const setOrderStatus = async (id: string, next: Order["status"]) => {
    setError(null);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      setOrders(
        (prev) => prev?.map((o) => (o.id === id ? { ...o, status: next } : o)) ?? null,
      );
    } else {
      setError(json.error || "Не удалось изменить статус заказа");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Заказы</h1>
      <StatusFilter current={status} onChange={setStatus} />
      {error ? <div className="card p-3 text-sm text-rose-400">{error}</div> : null}
      {orders === null ? (
        <div className="card h-24 animate-pulse" />
      ) : orders.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
          Нет заказов.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">#{o.id.slice(-6)}</div>
                  <div className="text-xs text-[color:var(--tg-text-muted)]">
                    {new Date(o.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => setOrderStatus(o.id, e.target.value as Order["status"])}
                  className="input !w-auto !py-2"
                >
                  <option value="PENDING">В обработке</option>
                  <option value="COMPLETED">Выполнен</option>
                  <option value="CANCELLED">Отменён</option>
                </select>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-[color:var(--tg-text-muted)]">Клиент: </span>
                {[o.user.firstName, o.user.lastName].filter(Boolean).join(" ") || "—"}
                {o.user.username ? ` · @${o.user.username}` : ""}{" "}
                <span className="text-[color:var(--tg-text-muted)]">
                  (id <code className="text-xs">{o.user.telegramId}</code>)
                </span>
              </div>
              <div className="mt-1 text-sm text-[color:var(--tg-text-muted)]">
                Оплата: {o.paymentMethod} · Доставка: {o.deliveryMethod}
              </div>
              {o.address ? (
                <div className="mt-1 text-sm">
                  <span className="text-[color:var(--tg-text-muted)]">Адрес: </span>
                  {o.address}
                </div>
              ) : null}
              {o.comment ? (
                <div className="mt-1 text-sm">
                  <span className="text-[color:var(--tg-text-muted)]">Комментарий: </span>
                  {o.comment}
                </div>
              ) : null}
              <ul className="mt-3 space-y-0.5 border-t border-white/5 pt-3 text-sm">
                {o.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span className="truncate pr-2">{it.productName}</span>
                    <span className="text-[color:var(--tg-text-muted)]">
                      ×{it.quantity} · {formatPrice(it.unitPrice * it.quantity, o.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-sm">
                <span className="text-[color:var(--tg-text-muted)]">Итого</span>
                <span className="font-semibold">{formatPrice(o.total, o.currency)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersInner />
    </Suspense>
  );
}
