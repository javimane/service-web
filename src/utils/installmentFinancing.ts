import type { MarketplaceCommission } from "@/services/commerceService";

export function calculateInstallmentFinancing(
  baseAmount: number,
  installments: number,
  rates: MarketplaceCommission[],
) {
  if (installments === 1) {
    return { totalAmount: baseAmount, installmentAmount: baseAmount, surchargePct: 0 };
  }
  const baseRate = rates.find((rate) => Number(rate.installments) === 1);
  const selectedRate = rates.find((rate) => Number(rate.installments) === installments);
  if (!baseRate || !selectedRate) return null;
  if (!Number.isFinite(baseAmount) || baseAmount < 0 ||
      !Number.isFinite(Number(baseRate.commission_pct)) ||
      !Number.isFinite(Number(selectedRate.commission_pct))) return null;
  const directPct = Math.max(0, Number(selectedRate.commission_pct) - Number(baseRate.commission_pct));
  const surchargePct = Number((directPct * (1 + Number(selectedRate.iva_pct ?? 21) / 100)).toFixed(2));
  const totalAmount = Math.round(baseAmount * (1 + surchargePct / 100));
  return {
    totalAmount,
    installmentAmount: Math.round(totalAmount / installments),
    surchargePct,
  };
}
