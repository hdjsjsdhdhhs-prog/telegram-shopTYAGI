"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface TelegramContextValue {
  initData: string;
  user: TelegramWebAppUser | null;
  ready: boolean;
  isInTelegram: boolean;
  webApp: TelegramWebApp | null;
}

const TelegramContext = createContext<TelegramContextValue>({
  initData: "",
  user: null,
  ready: false,
  isInTelegram: false,
  webApp: null,
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TelegramContextValue>({
    initData: "",
    user: null,
    ready: false,
    isInTelegram: false,
    webApp: null,
  });

  useEffect(() => {
    let cancelled = false;
    const tryInit = () => {
      const wa = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
      if (!wa) return false;
      try {
        wa.ready();
        wa.expand();
        wa.setHeaderColor("#0f1115");
        wa.setBackgroundColor("#0f1115");
      } catch {
        // ignore - older clients
      }
      const initData = wa.initData || "";
      const user = wa.initDataUnsafe?.user ?? null;
      if (!cancelled) {
        setState({
          initData,
          user,
          ready: true,
          isInTelegram: Boolean(initData) || Boolean(user),
          webApp: wa,
        });
      }
      return true;
    };

    if (tryInit()) return;

    // The script is injected with strategy="beforeInteractive", but on some
    // browsers (or when running outside Telegram) it may not be ready yet.
    const interval = setInterval(() => {
      if (tryInit()) clearInterval(interval);
    }, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!cancelled) {
        setState((prev) => ({ ...prev, ready: true }));
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}

/**
 * Build the headers object with the initData header used by all backend
 * requests that need to know who the current user is.
 */
export function useTelegramHeaders(): Record<string, string> {
  const { initData, user } = useTelegram();
  return useMemo(() => {
    if (initData) return { "x-telegram-init-data": initData };
    // Dev fallback: if SKIP_TELEGRAM_VALIDATION=1 on the backend, we can pass
    // a synthetic JSON payload so order placement etc. still work in a browser.
    if (user) {
      return { "x-telegram-init-data": JSON.stringify(user) };
    }
    // Final fallback: a deterministic dev user so the storefront works when
    // browsing outside Telegram. The backend will only honor this if
    // SKIP_TELEGRAM_VALIDATION=1.
    return {
      "x-telegram-init-data": JSON.stringify({
        id: 1000000,
        username: "dev",
        first_name: "Dev",
      }),
    };
  }, [initData, user]);
}
