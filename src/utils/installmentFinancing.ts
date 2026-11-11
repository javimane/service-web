import type { MarketplaceCommission } from "@/services/commerceService";

export function calculateInstallmentFinancing(
  baseAmount: number,
  installments: number,
  rates: MarketplaceCommission[],
) {
  if (installments === 1) {
    return {
      totalAmount: baseAmount,
      installmentAmount: baseAmount,
      surchargePct: 0,
      surchargeAmount: 0,
      coefficient: 1,
    };
  }
  const baseRate = rates.find((rate) => Number(rate.installments) === 1);
  const selectedRate = rates.find(
    (rate) => Number(rate.installments) === installments,
  );
  if (!baseRate || !selectedRate) return null;
  if (!Number.isFinite(baseAmount) || baseAmount < 0) return null;

  // Si la tasa tiene definido un coeficiente mayor a 0:
  // Precio * coeficiente de cuotas = precio con recargo del coeficiente (monto total)
  if (
    selectedRate.coefficient !== null &&
    selectedRate.coefficient !== undefined &&
    Number(selectedRate.coefficient) > 0
  ) {
    const coeff = Number(selectedRate.coefficient);
    const totalAmount = Math.round(baseAmount * coeff);
    const surchargeAmount = Math.max(0, totalAmount - baseAmount);
    const surchargePct =
      baseAmount > 0
        ? Number((((totalAmount - baseAmount) / baseAmount) * 100).toFixed(2))
        : 0;
    const installmentAmount = Math.round(totalAmount / installments);
    return {
      totalAmount,
      installmentAmount,
      surchargePct,
      surchargeAmount,
      coefficient: coeff,
    };
  }

  if (
    !Number.isFinite(Number(baseRate.commission_pct)) ||
    !Number.isFinite(Number(selectedRate.commission_pct))
  )
    return null;

  const directPct = Math.max(
    0,
    Number(selectedRate.commission_pct) - Number(baseRate.commission_pct),
  );
  const surchargePct = Number(
    (directPct * (1 + Number(selectedRate.iva_pct ?? 21) / 100)).toFixed(2),
  );
  const totalAmount = Math.round(baseAmount * (1 + surchargePct / 100));
  const surchargeAmount = totalAmount - baseAmount;
  return {
    totalAmount,
    installmentAmount: Math.round(totalAmount / installments),
    surchargePct,
    surchargeAmount,
    coefficient: null,
  };
}
