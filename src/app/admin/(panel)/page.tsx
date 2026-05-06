import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productCount, categoryCount, orderCount, pendingCount, lastOrders] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Товары" value={productCount} href="/admin/products" />
        <Stat label="Категории" value={categoryCount} href="/admin/categories" />
        <Stat label="Заказы" value={orderCount} href="/admin/orders" />
        <Stat label="В обработке" value={pendingCount} href="/admin/orders?status=PENDING" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[color:var(--tg-text-muted)]">
          Последние заказы
        </h2>
        {lastOrders.length === 0 ? (
          <div className="card p-6 text-center text-sm text-[color:var(--tg-text-muted)]">
            Пока нет заказов.
          </div>
        ) : (
          <ul className="space-y-2">
            {lastOrders.map((o) => (
              <li key={o.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/admin/orders`} className="font-semibold">
                    #{o.id.slice(-6)}
                  </Link>
                  <span className="text-xs text-[color:var(--tg-text-muted)]">
                    {new Date(o.createdAt).toLocaleString("ru-RU")}
                  </span>
                </div>
                <div className="mt-1 text-sm text-[color:var(--tg-text-muted)]">
                  {o.user.username ? `@${o.user.username}` : o.user.firstName || o.user.telegramId}
                  {" · "}
                  {o.items.length} поз.
                  {" · "}
                  {formatPrice(o.total, o.currency)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card p-4 transition-transform hover:scale-[1.01]">
      <div className="text-xs uppercase tracking-wider text-[color:var(--tg-text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Link>
  );
}
