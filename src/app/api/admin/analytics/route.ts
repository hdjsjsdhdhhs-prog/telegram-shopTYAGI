import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { calculateOrderFinancials } from "@/lib/profit";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MOSCOW_OFFSET = "+03:00";

interface DateRange {
  fromDate: string | null;
  toDate: string | null;
  from: Date | null;
  to: Date | null;
}

interface CompletedOrder {
  id: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  total: number;
  revenue: number;
  cost: number;
  profit: number;
  currency: string;
  completedAt: Date | null;
  createdAt: Date;
  user: {
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  items: {
    quantity: number;
    unitPrice: number;
    unitSalePrice: number | null;
    unitCostPrice: number | null;
  }[];
}

function formatDateInMoscow(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function startOfMonth(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function normalizeDate(value: string | null) {
  if (!value || !DATE_RE.test(value)) return null;
  return value;
}

function createRange(fromDate: string, toDate: string): DateRange {
  const [startDate, endDate] = fromDate <= toDate ? [fromDate, toDate] : [toDate, fromDate];

  return {
    fromDate: startDate,
    toDate: endDate,
    from: new Date(`${startDate}T00:00:00${MOSCOW_OFFSET}`),
    to: new Date(`${shiftDate(endDate, 1)}T00:00:00${MOSCOW_OFFSET}`),
  };
}

function createAllTimeRange(): DateRange {
  return {
    fromDate: null,
    toDate: null,
    from: null,
    to: null,
  };
}

function getOrderDate(order: CompletedOrder) {
  return order.completedAt ?? order.createdAt;
}

function isInRange(order: CompletedOrder, range: DateRange) {
  const date = getOrderDate(order);
  if (range.from && date < range.from) return false;
  if (range.to && date >= range.to) return false;
  return true;
}

function summarize(orders: CompletedOrder[], range: DateRange) {
  const filtered = orders.filter((order) => isInRange(order, range));
  const totals = filtered.reduce(
    (summary, order) => {
      const financials = calculateOrderFinancials(order.items);

      return {
        revenue: summary.revenue + financials.revenue,
        cost: summary.cost + financials.cost,
        profit: summary.profit + financials.profit,
        orderCount: summary.orderCount + 1,
      };
    },
    { revenue: 0, cost: 0, profit: 0, orderCount: 0 },
  );

  return {
    ...totals,
    fromDate: range.fromDate,
    toDate: range.toDate,
    currency: filtered[0]?.currency ?? "RUB",
  };
}

function serializeOrders(orders: CompletedOrder[], range: DateRange) {
  return orders
    .filter((order) => isInRange(order, range))
    .map((order) => {
      const financials = calculateOrderFinancials(order.items);
      const customerName =
        [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") ||
        order.user.username ||
        order.user.telegramId;

      return {
        id: order.id,
        shortId: order.id.slice(-6),
        customerName,
        username: order.user.username,
        telegramId: order.user.telegramId,
        currency: order.currency,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
        revenue: financials.revenue,
        cost: financials.cost,
        profit: financials.profit,
      };
    });
}

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const today = formatDateInMoscow(new Date());
  const yesterday = shiftDate(today, -1);
  const weekStart = shiftDate(today, -6);
  const monthStart = startOfMonth(today);

  const requestedDate = normalizeDate(url.searchParams.get("date"));
  const requestedFrom = normalizeDate(url.searchParams.get("from"));
  const requestedTo = normalizeDate(url.searchParams.get("to"));
  const requestedRange = url.searchParams.get("range");

  const selectedRange =
    requestedRange === "allTime"
      ? createAllTimeRange()
      : requestedDate
        ? createRange(requestedDate, requestedDate)
        : requestedFrom || requestedTo
          ? createRange(requestedFrom ?? requestedTo ?? today, requestedTo ?? requestedFrom ?? today)
          : createRange(today, today);

  const completedOrders = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          unitSalePrice: true,
          unitCostPrice: true,
        },
      },
    },
  });

  const orders = completedOrders as CompletedOrder[];
  const ranges = {
    today: createRange(today, today),
    yesterday: createRange(yesterday, yesterday),
    week: createRange(weekStart, today),
    month: createRange(monthStart, today),
    allTime: createAllTimeRange(),
  };

  return NextResponse.json({
    todayDate: today,
    presets: {
      today: summarize(orders, ranges.today),
      yesterday: summarize(orders, ranges.yesterday),
      week: summarize(orders, ranges.week),
      month: summarize(orders, ranges.month),
      allTime: summarize(orders, ranges.allTime),
    },
    selected: summarize(orders, selectedRange),
    orders: serializeOrders(orders, selectedRange),
  });
}
