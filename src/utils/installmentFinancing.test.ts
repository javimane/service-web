import { describe, expect, it } from "vitest";
import { calculateInstallmentFinancing } from "./installmentFinancing";
import type { MarketplaceCommission } from "@/services/commerceService";

const rates = [
  { id: 1, installments: 1, commission_pct: 11, iva_pct: 21, iva_commission_pct: 2.31, total_commission_pct: 13.31, is_active: true },
  { id: 2, installments: 3, commission_pct: 19.52, iva_pct: 21, iva_commission_pct: 4.1, total_commission_pct: 23.62, is_active: true },
] satisfies MarketplaceCommission[];

describe("installment financing", () => {
  it("matches the checkout surcharge for three installments", () => {
    expect(calculateInstallmentFinancing(10000, 3, rates)).toEqual({
      totalAmount: 11031,
      installmentAmount: 3677,
      surchargePct: 10.31,
    });
  });

  it("does not quote an unavailable rate", () => {
    expect(calculateInstallmentFinancing(10000, 6, rates)).toBeNull();
  });
});
