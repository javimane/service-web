export interface ProductPriceSource {
  price?: number | null;
  offer_price?: number | null;
  wholesale?: boolean | null;
  wholesale_price?: number | null;
  wholesale_unit?: number | null;
  offer_2x1?: boolean | null;
  offer_3x2?: boolean | null;
}

export function calculateProductPricing(
  product: ProductPriceSource,
  quantity: number,
) {
  const wholesaleMinimum = Number(product.wholesale_unit || 0);
  const wholesalePrice = Number(product.wholesale_price || 0);
  const wholesaleEnabled = Boolean(product.wholesale);
  const wholesaleApplied = wholesaleEnabled && wholesalePrice > 0 &&
    wholesaleMinimum > 0 && quantity >= wholesaleMinimum;
  const unitPrice = Math.max(0, (wholesaleApplied ? wholesalePrice
    : Number(product.offer_price || 0) > 0 ? Number(product.offer_price)
    : Number(product.price || 0)));
  const promotion = product.offer_2x1 ? "2x1" : product.offer_3x2 ? "3x2" : null;
  const paidUnits = promotion === "2x1" ? quantity - Math.floor(quantity / 2)
    : promotion === "3x2" ? quantity - Math.floor(quantity / 3) : quantity;
  return {
    unitPrice,
    subtotal: Math.round(unitPrice * paidUnits * 100) / 100,
    paidUnits,
    promotion,
    wholesaleApplied,
    wholesaleMinimum: wholesaleEnabled && wholesalePrice > 0 ? wholesaleMinimum : 0,
  };
}
