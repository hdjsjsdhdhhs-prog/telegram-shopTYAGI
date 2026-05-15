"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

interface Summary {
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
  currency: string;
  fromDate: string | null;
  toDate: string | null;
}

interface AnalyticsOrder {
  id: string;
  shortId: string;
  customerName: string;
  username: string | null;
  telegramId: string;
  currency: string;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface AnalyticsResponse {
  todayDate: string;
  presets: {
    today: Summary;
    yesterday: Summary;
    week: Summary;
    month: Summary;
    allTime: Summary;
  };
  selected: Summary;
  orders: AnalyticsOrder[];
}

const PRESET_LABELS = {
  today: "Сегодня",
  yesterday: "Вчера",
  week: "Неделя",
  month: "Месяц",
  allTime: "Все время",
} as const;

type PresetKey = keyof AnalyticsResponse["presets"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"date" | "range">("date");
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async (query = "") => {
    setLoading(true);
    const res = await fetch(`/api/admin/analytics${query ? `?${query}` : ""}`);
    const json = (await res.json()) as AnalyticsResponse;
    setData(json);
    setDate((current) => current || json.todayDate);
    setFrom((current) => current || json.todayDate);
    setTo((current) => current || json.todayDate);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const applyPreset = (key: PresetKey) => {
    const summary = data?.presets[key];
    if (!summary) return;

    if (key === "allTime") {
      void load("range=allTime");
      return;
    }

    if (summary.fromDate && summary.fromDate === summary.toDate) {
      setMode("date");
      setDate(summary.fromDate);
      void load(`date=${summary.fromDate}`);
      return;
    }

    if (summary.fromDate && summary.toDate) {
      setMode("range");
      setFrom(summary.fromDate);
      setTo(summary.toDate);
      void load(`from=${summary.fromDate}&to=${summary.toDate}`);
    }
  };

  const applyFilter = () => {
    if (mode === "date") {
      void load(`date=${date || data?.todayDate || ""}`);
      return;
    }

    const start = from || to || data?.todayDate || "";
    const end = to || from || data?.todayDate || "";
    void load(`from=${start}&to=${end}`);
  };

  return (
    <div className="space-y-5 pb-16 md:pb-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
          <div className="text-sm text-[color:var(--tg-text-muted)]">
            Прибыль по выполненным заказам
          </div>
        </div>
      </div>

      {data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {(Object.keys(PRESET_LABELS) as PresetKey[]).map((key) => (
            <PresetCard
              key={key}
              label={PRESET_LABELS[key]}
              summary={data.presets[key]}
              onClick={() => applyPreset(key)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="card h-28 animate-pulse" />
          ))}
        </div>
      )}

      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-end">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[color:var(--tg-bg-3)] p-1">
            <button
              type="button"
              onClick={() => setMode("date")}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                mode === "date" ? "bg-blue-500 text-white" : "text-[color:var(--tg-text-muted)]"
              }`}
            >
              Дата
            </button>
            <button
              type="button"
              onClick={() => setMode("range")}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                mode === "range" ? "bg-blue-500 text-white" : "text-[color:var(--tg-text-muted)]"
              }`}
            >
              Период
            </button>
          </div>

          {mode === "date" ? (
            <Field label="Выбранная дата">
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="С">
                <input
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="По">
                <input
                  type="date"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
            </div>
          )}

          <button type="button" onClick={applyFilter} className="btn-primary !py-3 md:w-36">
            Применить
          </button>
        </div>
      </section>

      {data ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Выручка" value={formatPrice(data.selected.revenue, data.selected.currency)} />
          <MetricCard label="Себестоимость" value={formatPrice(data.selected.cost, data.selected.currency)} />
          <MetricCard
            label="Чистая прибыль"
            value={formatPrice(data.selected.profit, data.selected.currency)}
            accent={data.selected.profit >= 0 ? "positive" : "negative"}
          />
          <MetricCard label="Заказы" value={data.selected.orderCount.toString()} />
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--tg-text-muted)]">
            Заказы
          </h2>
          {loading ? <span className="text-xs text-[color:var(--tg-text-muted)]">Обновляем...</span> : null}
        </div>

        {!data || loading ? (
          <div className="card h-28 animate-pulse" />
        ) : data.orders.length === 0 ? (
          <div className="card p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
            Нет выполненных заказов за выбранный период.
          </div>
        ) : (
          <OrdersTable orders={data.orders} />
        )}
      </section>
    </div>
  );
}

function PresetCard({
  label,
  summary,
  onClick,
}: {
  label: string;
  summary: Summary;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="card p-4 text-left transition-transform active:scale-[0.99]">
      <div className="text-xs uppercase tracking-wider text-[color:var(--tg-text-muted)]">
        {label}
      </div>
      <div className={`mt-2 text-xl font-bold ${summary.profit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
        {formatPrice(summary.profit, summary.currency)}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--tg-text-muted)]">
        <span>{summary.orderCount} зак.</span>
        <span>{formatPrice(summary.revenue, summary.currency)}</span>
      </div>
    </button>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}) {
  const color =
    accent === "positive"
      ? "text-emerald-300"
      : accent === "negative"
        ? "text-rose-300"
        : "text-white";

  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wider text-[color:var(--tg-text-muted)]">
        {label}
      </div>
      <div className={`mt-1 break-words text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: AnalyticsOrder[] }) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {orders.map((order) => (
          <div key={order.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">#{order.shortId}</div>
                <div className="text-xs text-[color:var(--tg-text-muted)]">
                  {new Date(order.completedAt ?? order.createdAt).toLocaleString("ru-RU")}
                </div>
              </div>
              <div className={`text-right font-semibold ${order.profit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {formatPrice(order.profit, order.currency)}
              </div>
            </div>
            <div className="mt-2 text-sm">
              {order.customerName}
              {order.username ? <span className="text-[color:var(--tg-text-muted)]"> · @{order.username}</span> : null}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <MiniMetric label="Выручка" value={formatPrice(order.revenue, order.currency)} />
              <MiniMetric label="Себес." value={formatPrice(order.cost, order.currency)} />
              <MiniMetric label="Поз." value={order.itemCount.toString()} />
            </div>
          </div>
        ))}
      </div>

      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[color:var(--tg-bg-3)] text-xs uppercase tracking-wider text-[color:var(--tg-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Заказ</th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 text-right font-medium">Выручка</th>
              <th className="px-4 py-3 text-right font-medium">Себестоимость</th>
              <th className="px-4 py-3 text-right font-medium">Прибыль</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="align-top">
                <td className="px-4 py-3 font-semibold">#{order.shortId}</td>
                <td className="px-4 py-3">
                  <div>{order.customerName}</div>
                  <div className="text-xs text-[color:var(--tg-text-muted)]">
                    {order.username ? `@${order.username}` : order.telegramId}
                  </div>
                </td>
                <td className="px-4 py-3 text-[color:var(--tg-text-muted)]">
                  {new Date(order.completedAt ?? order.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="px-4 py-3 text-right">{formatPrice(order.revenue, order.currency)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(order.cost, order.currency)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${order.profit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {formatPrice(order.profit, order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[color:var(--tg-text-muted)]">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-[color:var(--tg-text-muted)]">{label}</div>
      {children}
    </label>
  );
}
