"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number; // minor units
  currency: string;
  imageUrl?: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
  totalQuantity: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tg-mini-shop-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore corrupt localStorage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const add: CartContextValue["add"] = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + qty } : p,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const remove: CartContextValue["remove"] = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setQuantity: CartContextValue["setQuantity"] = useCallback(
    (id, qty) => {
      setItems((prev) =>
        qty <= 0
          ? prev.filter((p) => p.id !== id)
          : prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    let q = 0;
    let p = 0;
    for (const it of items) {
      q += it.quantity;
      p += it.price * it.quantity;
    }
    return { q, p };
  }, [items]);

  const value: CartContextValue = useMemo(
    () => ({
      items,
      add,
      remove,
      setQuantity,
      clear,
      totalQuantity: totals.q,
      totalPrice: totals.p,
    }),
    [items, add, remove, setQuantity, clear, totals.q, totals.p],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
