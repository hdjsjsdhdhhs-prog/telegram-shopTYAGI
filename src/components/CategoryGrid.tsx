"use client";

import Image from "next/image";
import Link from "next/link";

export interface CategoryCardData {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

export function CategoryGrid({ categories }: { categories: CategoryCardData[] }) {
  if (categories.length === 0) {
    return (
      <div className="card mt-2 p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
        Категории пока не добавлены.
      </div>
    );
  }
  return (
    <div className="mt-2 grid grid-cols-2 gap-3">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.id}`}
          className="card group relative aspect-[5/4] overflow-hidden"
        >
          {c.imageUrl ? (
            <Image
              src={c.imageUrl}
              alt={c.name}
              fill
              sizes="(max-width: 480px) 50vw, 240px"
              className="object-cover transition-transform duration-200 group-active:scale-95"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--tg-bg-3)] to-[color:var(--tg-bg-2)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <span className="text-base font-semibold text-white drop-shadow">
              {c.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
