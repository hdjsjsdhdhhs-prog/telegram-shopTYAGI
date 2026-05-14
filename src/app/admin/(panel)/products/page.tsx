"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { formatPrice } from "@/lib/format";
import { getProductDisplayPrice, getProductOldPrice } from "@/lib/pricing";

interface Category {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  salePrice: number | null;
  saleBadge: string | null;
  isSale: boolean;
  currency: string;
  imageUrl: string | null;
  inStock: boolean;
  categoryId: string;
  category?: Category;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/categories"),
    ]);
    const p = await pRes.json();
    const c = await cRes.json();
    setProducts(p.products ?? []);
    setCategories(c.categories ?? []);
  };
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Товары</h1>
        <button
          onClick={() => setCreating(true)}
          disabled={categories.length === 0}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          title={categories.length === 0 ? "Сначала создайте категорию" : ""}
        >
          + Товар
        </button>
      </div>

      {categories.length === 0 && (
        <div className="card p-4 text-sm text-[color:var(--tg-text-muted)]">
          Сначала создайте хотя бы одну категорию во вкладке «Категории».
        </div>
      )}

      {products === null ? (
        <div className="card h-24 animate-pulse" />
      ) : products.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
          Товаров пока нет.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {products.map((p) => {
            const oldPrice = getProductOldPrice(p);

            return (
              <li key={p.id} className="card flex items-center gap-3 p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[color:var(--tg-bg-3)]">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[color:var(--tg-text-muted)]">
                    <span>{p.category?.name ?? "—"}</span>
                    <span>·</span>
                    <span>{formatPrice(getProductDisplayPrice(p), p.currency)}</span>
                    {oldPrice ? <span className="line-through">{formatPrice(oldPrice, p.currency)}</span> : null}
                    {p.isSale ? (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-medium text-rose-300">
                        Распродажа
                      </span>
                    ) : null}
                    {!p.inStock ? <span>· нет в наличии</span> : null}
                  </div>
                </div>
                <button onClick={() => setEditing(p)} className="btn-ghost">
                  Редактировать
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(creating || editing) && (
        <ProductEditor
          categories={categories}
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setCreating(false);
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function ProductEditor({
  categories,
  initial,
  onClose,
  onSaved,
}: {
  categories: Category[];
  initial?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceMajor, setPriceMajor] = useState(
    initial ? (initial.price / 100).toString() : "",
  );
  const [oldPriceMajor, setOldPriceMajor] = useState(
    initial?.oldPrice != null ? (initial.oldPrice / 100).toString() : "",
  );
  const [salePriceMajor, setSalePriceMajor] = useState(
    initial?.salePrice != null ? (initial.salePrice / 100).toString() : "",
  );
  const [saleBadge, setSaleBadge] = useState(initial?.saleBadge ?? "");
  const [isSale, setIsSale] = useState(initial?.isSale ?? false);
  const [currency, setCurrency] = useState(initial?.currency ?? "RUB");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [inStock, setInStock] = useState(initial?.inStock ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseOptionalPrice = (value: string, label: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const priceNumber = Math.round(Number(trimmed) * 100);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      throw new Error(`Некорректная цена: ${label}`);
    }

    return priceNumber;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNumber = Math.round(Number(priceMajor) * 100);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Некорректная цена");
      return;
    }
    let oldPriceNumber: number | null = null;
    let salePriceNumber: number | null = null;
    try {
      oldPriceNumber = parseOptionalPrice(oldPriceMajor, "старая цена");
      salePriceNumber = parseOptionalPrice(salePriceMajor, "цена со скидкой");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Некорректная цена");
      return;
    }
    if (!categoryId) {
      setError("Выберите категорию");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const url = initial
        ? `/api/admin/products/${initial.id}`
        : `/api/admin/products`;
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          price: priceNumber,
          oldPrice: oldPriceNumber,
          salePrice: salePriceNumber,
          saleBadge: saleBadge.trim() || null,
          isSale,
          currency,
          imageUrl: imageUrl || null,
          categoryId,
          inStock,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "save_failed");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!initial) return;
    if (!confirm(`Удалить товар "${initial.name}"?`)) return;
    const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (res.ok) onSaved();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="card w-full max-w-md space-y-3 rounded-t-3xl p-5 max-h-[92dvh] overflow-y-auto sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold">{initial ? "Редактирование" : "Новый товар"}</h2>
        <Field label="Название">
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Описание">
          <textarea
            className="input min-h-24 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Цена">
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              required
              value={priceMajor}
              onChange={(e) => setPriceMajor(e.target.value)}
            />
          </Field>
          <Field label="Валюта">
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-[color:var(--tg-bg-3)] px-3 py-3">
          <span>
            <span className="block text-sm">Sale / Распродажа</span>
            <span className="block text-xs text-[color:var(--tg-text-muted)]">
              Показывать товар в разделе «Распродажа»
            </span>
          </span>
          <input
            type="checkbox"
            checked={isSale}
            onChange={(e) => setIsSale(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-rose-500"
          />
        </label>
        {isSale ? (
          <div className="space-y-3 rounded-xl bg-[color:var(--tg-bg-3)] p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Старая цена">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={oldPriceMajor}
                  onChange={(e) => setOldPriceMajor(e.target.value)}
                />
              </Field>
              <Field label="Цена со скидкой">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={salePriceMajor}
                  onChange={(e) => setSalePriceMajor(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Бейдж распродажи">
              <input
                className="input"
                maxLength={40}
                placeholder="Sale"
                value={saleBadge}
                onChange={(e) => setSaleBadge(e.target.value)}
              />
            </Field>
          </div>
        ) : null}
        <Field label="Категория">
          <select
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Изображение">
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </Field>
        <label className="flex items-center justify-between rounded-xl bg-[color:var(--tg-bg-3)] px-3 py-3">
          <span className="text-sm">В наличии</span>
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="h-5 w-5 accent-blue-500"
          />
        </label>
        {error ? <div className="text-sm text-rose-400">{error}</div> : null}
        <div className="flex gap-2 pt-2">
          {initial && (
            <button type="button" onClick={remove} className="btn-secondary !bg-rose-500/15 !text-rose-400">
              Удалить
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary">
            Отмена
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
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
