export interface ProfitLineItem {
  quantity: number;
  unitPrice: number;
  unitSalePrice?: number | null;
  unitCostPrice?: number | null;
}

export interface OrderFinancials {
  revenue: number;
  cost: number;
  profit: number;
}

export function getItemRevenue(item: ProfitLineItem) {
  return (item.unitSalePrice ?? item.unitPrice) * item.quantity;
}

export function getItemCost(item: ProfitLineItem) {
  return (item.unitCostPrice ?? 0) * item.quantity;
}

export function calculateOrderFinancials(items: ProfitLineItem[]): OrderFinancials {
  return items.reduce<OrderFinancials>(
    (totals, item) => {
      const revenue = getItemRevenue(item);
      const cost = getItemCost(item);

      return {
        revenue: totals.revenue + revenue,
        cost: totals.cost + cost,
        profit: totals.profit + revenue - cost,
      };
    },
    { revenue: 0, cost: 0, profit: 0 },
  );
}
