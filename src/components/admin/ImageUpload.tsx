"use client";

import { useRef, useState } from "react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUpload({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "upload_failed");
      }
      const j = (await res.json()) as { url: string };
      onChange(j.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[color:var(--tg-bg-3)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[color:var(--tg-text-muted)]">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-xl bg-[color:var(--tg-bg-3)] px-3 py-2 text-sm font-medium"
          >
            {uploading ? "Загрузка..." : value ? "Заменить" : "Загрузить"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-xl px-3 py-2 text-sm text-[color:var(--tg-text-muted)] hover:text-white"
            >
              Удалить
            </button>
          ) : null}
        </div>
      </div>
      <input
        type="text"
        className="input"
        placeholder="...или введите URL изображения"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
    </div>
  );
}
