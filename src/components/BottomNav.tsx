"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

const links = [
  { href: "/", label: "Каталог", icon: HomeIcon },
  { href: "/cart", label: "Корзина", icon: CartIcon },
  { href: "/profile", label: "Профиль", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { totalQuantity } = useCart();

  // Hide nav on admin and checkout to keep UI focused
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-md">
      <div className="m-3 grid grid-cols-3 gap-1 rounded-2xl border border-white/5 bg-[color:var(--tg-bg-2)]/95 backdrop-blur-md p-1.5 shadow-2xl">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                active
                  ? "bg-[color:var(--tg-bg-3)] text-white"
                  : "text-[color:var(--tg-text-muted)] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {href === "/cart" && totalQuantity > 0 && (
                <span className="absolute right-2 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white">
                  {totalQuantity}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6h-6v6H5a2 2 0 01-2-2v-9z" />
    </svg>
  );
}

function CartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 12.3a2 2 0 002 1.7h8.4a2 2 0 002-1.6L21 8H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21a8 8 0 0116 0" />
    </svg>
  );
}
