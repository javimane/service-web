import { describe, expect, it } from "vitest";
import { calculateCheckoutCftea } from "./checkoutFinancialCost";

describe("checkout CFTEA", () => {
  it("shows zero for a single payment and interest-free installments", () => {
    expect(calculateCheckoutCftea(10000, 10000, 1)).toBe(0);
    expect(calculateCheckoutCftea(10000, 10000, 12)).toBe(0);
  });

  it("recovers the annual effective rate from equal monthly payments", () => {
    const monthlyRate = 0.1;
    const principal = 10000;
    const months = 3;
    const payment = principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    expect(calculateCheckoutCftea(principal, payment * months, months))
      .toBeCloseTo((Math.pow(1.1, 12) - 1) * 100, 7);
  });

  it("uses the full purchase cash price, including shipping and items without surcharge", () => {
    const purchaseRate = calculateCheckoutCftea(12000, 13500, 3)!;
    expect(purchaseRate).toBeGreaterThan(0);
    expect(purchaseRate).toBeLessThan(calculateCheckoutCftea(10000, 11500, 3)!);
  });

  it("does not invent a rate when amounts or installments are invalid", () => {
    expect(calculateCheckoutCftea(0, 100, 3)).toBeNull();
    expect(calculateCheckoutCftea(100, NaN, 3)).toBeNull();
    expect(calculateCheckoutCftea(100, 90, 3)).toBeNull();
    expect(calculateCheckoutCftea(100, 110, 0)).toBeNull();
  });
});
