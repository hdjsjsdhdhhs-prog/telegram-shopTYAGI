"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useTelegram, useTelegramHeaders } from "@/components/TelegramProvider";
import { Header } from "@/components/Header";
import { formatPrice } from "@/lib/format";

const PAYMENTS = [
  { value: "CASH", label: "Наличкой при получении" },
  { value: "CARD", label: "Переводом при получении" },
] as const;

const DELIVERIES = [
  { value: "COURIER", label: "Курьер" },
  { value: "PICKUP", label: "Самовывоз" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clear } = useCart();
  const { webApp } = useTelegram();
  const headers = useTelegramHeaders();

  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENTS)[number]["value"]>("CASH");
  const [deliveryMethod, setDeliveryMethod] =
    useState<(typeof DELIVERIES)[number]["value"]>("COURIER");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = items[0]?.currency ?? "RUB";
  const needsAddress = deliveryMethod === "COURIER";
  const canSubmit =
    items.length > 0 && !submitting && (!needsAddress || address.trim().length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          items: items.map((it) => ({ productId: it.id, quantity: it.quantity })),
          paymentMethod,
          deliveryMethod,
          address: needsAddress ? address : null,
          comment: comment || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; orderId?: string; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Не удалось оформить заказ");
      }
      clear();
      try {
        webApp?.HapticFeedback?.notificationOccurred("success");
      } catch {
        /* ignore */
      }
      router.replace(`/orders/success?id=${encodeURIComponent(json.orderId || "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title="Оформление" showBack />
      <main className="px-4">
        <form onSubmit={submit} className="mt-2 space-y-4">
          <Section title="Способ оплаты">
            <div className="space-y-2">
              {PAYMENTS.map((p) => (
                <RadioRow
                  key={p.value}
                  name="payment"
                  value={p.value}
                  label={p.label}
                  checked={paymentMethod === p.value}
                  onChange={() => setPaymentMethod(p.value)}
                />
              ))}
            </div>
          </Section>

          <Section title="Способ доставки">
            <div className="space-y-2">
              {DELIVERIES.map((d) => (
                <RadioRow
                  key={d.value}
                  name="delivery"
                  value={d.value}
                  label={d.label}
                  checked={deliveryMethod === d.value}
                  onChange={() => setDeliveryMethod(d.value)}
                />
              ))}
            </div>
          </Section>

          {needsAddress && (
            <Section title="Адрес доставки">
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Город, улица, дом, квартира"
                required
              />
            </Section>
          )}

          <Section title="Комментарий">
            <textarea
              className="input min-h-24 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Пожелания к заказу (необязательно)"
            />
          </Section>

          <div className="card flex items-center justify-between p-4">
            <span className="text-[color:var(--tg-text-muted)]">Итого</span>
            <span className="text-xl font-bold">{formatPrice(totalPrice, currency)}</span>
          </div>

          {error ? (
            <div className="card p-3 text-sm text-rose-400">{error}</div>
          ) : null}

          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {submitting ? "Отправка..." : "Оформить заказ"}
          </button>
        </form>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--tg-text-muted)]">
        {title}
      </h3>
      <div className="card p-3">{children}</div>
    </section>
  );
}

function RadioRow({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-white/5">
      <span className="text-sm">{label}</span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          checked ? "border-blue-500" : "border-white/20"
        }`}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
      </span>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
    </label>
  );
}
