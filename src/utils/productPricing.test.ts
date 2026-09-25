import { describe, expect, it } from "vitest";
import { calculateProductPricing } from "./productPricing";

describe("calculateProductPricing", () => {
  const product = { price: 100, offer_price: 90, wholesale: true, wholesale_price: 70, wholesale_unit: 6, offer_3x2: true };

  it("switches to wholesale at the minimum and applies the quantity promotion", () => {
    expect(calculateProductPricing(product, 5).subtotal).toBe(360);
    expect(calculateProductPricing(product, 6)).toMatchObject({ subtotal: 280, unitPrice: 70, paidUnits: 4, wholesaleApplied: true });
  });

  it("uses each selected product's own promotion", () => {
    expect(calculateProductPricing({ price: 120, offer_2x1: true }, 2).subtotal).toBe(120);
  });
});
