import { describe, expect, it } from "vitest";
import { calculateInstallmentFinancing } from "./installmentFinancing";
import type { MarketplaceCommission } from "@/services/commerceService";

const ratesWithCoefficient = [
  { id: 1, installments: 1, commission_pct: 11, iva_pct: 21, iva_commission_pct: 2.31, total_commission_pct: 13.31, coefficient: 1, is_active: true },
  { id: 2, installments: 3, commission_pct: 19.52, iva_pct: 21, iva_commission_pct: 4.1, total_commission_pct: 23.62, coefficient: 1.15, is_active: true },
  { id: 3, installments: 6, commission_pct: 25.0, iva_pct: 21, iva_commission_pct: 5.25, total_commission_pct: 30.25, coefficient: 1.28, is_active: true },
] satisfies MarketplaceCommission[];

const legacyRates = [
  { id: 1, installments: 1, commission_pct: 11, iva_pct: 21, iva_commission_pct: 2.31, total_commission_pct: 13.31, is_active: true },
  { id: 2, installments: 3, commission_pct: 19.52, iva_pct: 21, iva_commission_pct: 4.1, total_commission_pct: 23.62, is_active: true },
] satisfies MarketplaceCommission[];

describe("installment financing", () => {
  it("calculates surcharge and per-installment amount using coefficient", () => {
    expect(calculateInstallmentFinancing(10000, 3, ratesWithCoefficient)).toEqual({
      totalAmount: 11500,
      installmentAmount: 3833,
      surchargePct: 15,
      surchargeAmount: 1500,
      coefficient: 1.15,
    });
  });

  it("calculates 6 installments with coefficient", () => {
    expect(calculateInstallmentFinancing(50000, 6, ratesWithCoefficient)).toEqual({
      totalAmount: 64000,
      installmentAmount: 10667,
      surchargePct: 28,
      surchargeAmount: 14000,
      coefficient: 1.28,
    });
  });

  it("matches the checkout surcharge for three installments using legacy VAT fallback", () => {
    expect(calculateInstallmentFinancing(10000, 3, legacyRates)).toEqual({
      totalAmount: 11031,
      installmentAmount: 3677,
      surchargePct: 10.31,
      surchargeAmount: 1031,
      coefficient: null,
    });
  });

  it("does not quote an unavailable rate", () => {
    expect(calculateInstallmentFinancing(10000, 12, ratesWithCoefficient)).toBeNull();
  });
});
