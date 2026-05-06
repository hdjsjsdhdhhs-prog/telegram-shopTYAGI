"use client";

import { useCallback, useEffect, useState } from "react";

export function useFavorite(
  productId: string,
  headers: Record<string, string>,
  ready: boolean,
) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/favorites/${productId}`, { headers });
        if (!res.ok) return;
        const j = (await res.json()) as { favorite: boolean };
        if (!cancelled) setIsFavorite(j.favorite);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, ready, headers]);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites/${productId}`, {
        method: isFavorite ? "DELETE" : "POST",
        headers,
      });
      if (res.ok) setIsFavorite(!isFavorite);
    } finally {
      setLoading(false);
    }
  }, [isFavorite, productId, headers]);

  return { isFavorite, toggle, loading };
}
