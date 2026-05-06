"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/admin/categories");
    const j = await res.json();
    setItems(j.categories ?? []);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Категории</h1>
        <button onClick={() => setCreating(true)} className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white">
          + Категория
        </button>
      </div>

      {items === null ? (
        <div className="card h-24 animate-pulse" />
      ) : items.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
          Категорий пока нет.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((c) => (
            <li key={c.id} className="card flex items-center gap-3 p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[color:var(--tg-bg-3)]">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="text-xs text-[color:var(--tg-text-muted)]">
                  /{c.slug} · {c._count?.products ?? 0} товаров
                </div>
              </div>
              <button onClick={() => setEditing(c)} className="btn-ghost">
                Редактировать
              </button>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <CategoryEditor
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

function CategoryEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = initial
        ? `/api/admin/categories/${initial.id}`
        : `/api/admin/categories`;
      const method = initial ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        imageUrl: imageUrl || null,
      };
      if (slug.trim()) body.slug = slug.trim();
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    if (!confirm(`Удалить категорию "${initial.name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${initial.id}`, { method: "DELETE" });
    if (res.ok) onSaved();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="card w-full max-w-md space-y-3 rounded-t-3xl p-5 sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold">{initial ? "Редактирование" : "Новая категория"}</h2>
        <Field label="Название">
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Slug (необязательно)">
          <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto" />
        </Field>
        <Field label="Сортировка">
          <input
            className="input"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Изображение">
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </Field>
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
