import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[color:var(--tg-bg)]">
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-r md:border-white/5 md:bg-[color:var(--tg-bg-2)]">
        <div className="px-5 py-5 text-lg font-semibold">Admin</div>
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          <NavLink href="/admin">Dashboard</NavLink>
          <NavLink href="/admin/categories">Категории</NavLink>
          <NavLink href="/admin/products">Товары</NavLink>
          <NavLink href="/admin/orders">Заказы</NavLink>
        </nav>
        <form action="/api/admin/logout" method="POST" className="px-3 pb-4">
          <button className="btn-secondary w-full">Выйти</button>
        </form>
      </aside>
      <div className="md:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        <nav className="md:hidden sticky bottom-0 inset-x-0 z-30 border-t border-white/5 bg-[color:var(--tg-bg-2)]/95 backdrop-blur">
          <div className="grid grid-cols-4">
            <MobileLink href="/admin">Главная</MobileLink>
            <MobileLink href="/admin/categories">Категории</MobileLink>
            <MobileLink href="/admin/products">Товары</MobileLink>
            <MobileLink href="/admin/orders">Заказы</MobileLink>
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--tg-text-muted)] hover:bg-white/5 hover:text-white"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center px-2 py-3 text-xs font-medium text-[color:var(--tg-text-muted)] hover:text-white"
    >
      {children}
    </Link>
  );
}
