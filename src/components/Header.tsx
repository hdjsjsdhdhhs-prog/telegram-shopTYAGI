"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTelegram } from "./TelegramProvider";
import { useEffect } from "react";

export function Header({ title, showBack = false }: { title?: string; showBack?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { webApp } = useTelegram();

  useEffect(() => {
    if (!webApp) return;
    const back = webApp.BackButton;
    if (!back) return;
    const handler = () => router.back();

    if (showBack) {
      back.show();
      back.onClick(handler);
    } else {
      back.hide();
    }
    return () => {
      try {
        back.offClick(handler);
        back.hide();
      } catch {
        // ignore older clients
      }
    };
  }, [showBack, webApp, router, pathname]);

  return (
    <header className="sticky top-0 z-20 -mx-0 bg-[color:var(--tg-bg)]/85 px-4 pt-4 pb-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => router.back()}
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--tg-bg-2)] text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight"
          >
            Во Все Тяжечки VN
          </Link>
        )}
        {title ? (
          <h1 className="ml-1 text-lg font-semibold">{title}</h1>
        ) : null}
      </div>
    </header>
  );
}
