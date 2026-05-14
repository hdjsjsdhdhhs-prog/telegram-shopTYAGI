export interface SalePricedProduct {
  price: number;
  oldPrice?: number | null;
  salePrice?: number | null;
  saleBadge?: string | null;
  isSale?: boolean | null;
}

export function getProductDisplayPrice(product: SalePricedProduct) {
  return product.isSale && product.salePrice != null ? product.salePrice : product.price;
}

export function getProductOldPrice(product: SalePricedProduct) {
  const displayPrice = getProductDisplayPrice(product);

  if (!product.isSale || product.oldPrice == null || product.oldPrice <= displayPrice) {
    return null;
  }

  return product.oldPrice;
}

export function getProductSaleBadge(product: SalePricedProduct) {
  if (!product.isSale) return null;

  const badge = product.saleBadge?.trim();
  return badge ? badge : null;
}
