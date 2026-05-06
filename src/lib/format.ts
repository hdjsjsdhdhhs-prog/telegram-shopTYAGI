/** Format a price stored in minor units (e.g. kopecks/cents) as a human string. */
export function formatPrice(amount: number, currency = "RUB"): string {
  const major = amount / 100;
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: major % 1 === 0 ? 0 : 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
