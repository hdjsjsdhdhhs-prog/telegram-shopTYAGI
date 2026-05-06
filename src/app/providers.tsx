"use client";

import { TelegramProvider } from "@/components/TelegramProvider";
import { CartProvider } from "@/components/CartProvider";
import { BottomNav } from "@/components/BottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <CartProvider>
        {children}
        <BottomNav />
      </CartProvider>
    </TelegramProvider>
  );
}
