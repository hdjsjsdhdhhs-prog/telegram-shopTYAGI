"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/Header";

function SuccessInner() {
  const params = useSearchParams();
  const id = params.get("id");
  return (
    <>
      <Header title="Заказ оформлен" />
      <main className="px-4">
        <div className="card mt-4 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold">Спасибо!</h1>
          <p className="mt-1 text-sm text-[color:var(--tg-text-muted)]">
            Ваш заказ #{id?.slice(-6) ?? "—"} принят. Мы свяжемся с вами в Telegram.
          </p>
          <Link href="/profile" className="btn-secondary mt-5">
            Перейти в профиль
          </Link>
          <Link href="/" className="btn-ghost mt-2 mx-auto block">
            К каталогу
          </Link>
        </div>
      </main>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
