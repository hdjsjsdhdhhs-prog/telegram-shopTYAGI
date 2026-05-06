"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "login_failed");
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold">Вход в админ-панель</h1>
        <p className="mt-1 text-sm text-[color:var(--tg-text-muted)]">
          Введите пароль администратора.
        </p>
        <div className="mt-4">
          <input
            type="password"
            className="input"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>
        {error ? (
          <div className="mt-3 text-sm text-rose-400">
            {error === "invalid_credentials" ? "Неверный пароль" : error}
          </div>
        ) : null}
        <button type="submit" className="btn-primary mt-4" disabled={submitting}>
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
