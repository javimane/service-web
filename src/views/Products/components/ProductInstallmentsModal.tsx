"use client";

import React from "react";
import { CreditCard, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import {
  commerceService,
  MarketplaceCommission,
} from "@/services/commerceService";
import "./ProductInstallmentsModal.css";

interface ProductInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  installmentsEnabled: boolean;
  maxInstallments: number;
  productName: string;
}

// Tasas directas vigentes de Getnet (sin IVA) para calcular la diferencia si la API no estuviera disponible
const FALLBACK_GETNET_DIRECT_RATES: Record<number, number> = {
  1: 0,
  2: 5.57,
  3: 8.52,
  6: 16.48,
  9: 24.28,
  12: 32.58,
  18: 49.38,
};

export default function ProductInstallmentsModal({
  isOpen,
  onClose,
  price,
  installmentsEnabled,
  maxInstallments,
  productName,
}: ProductInstallmentsModalProps) {
  const { data: commissions = [], isLoading } = useQuery<
    MarketplaceCommission[]
  >({
    queryKey: ["marketplace-commissions"],
    queryFn: async () => {
      const res = await commerceService.commissions();
      return Array.isArray(res) ? res : [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  if (!isOpen) return null;

  const validMax = Math.max(1, maxInstallments || 1);

  // Cuotas disponibles (1, 2, 3, 6, 9, 12, 18)
  const availableInstallmentCounts =
    commissions.length > 0
      ? commissions
          .map((c) => c.installments)
          .filter((inst) => [1, 2, 3, 6, 9, 12, 18].includes(inst))
          .sort((a, b) => a - b)
      : [1, 2, 3, 6, 9, 12, 18];

  // Comisión base en 1 pago de la columna commission_pct (ej: 11.00%)
  const baseRateObj = commissions.find((c) => c.installments === 1);
  const baseCommissionPct = baseRateObj
    ? Number(baseRateObj.commission_pct)
    : 11.0;

  // Opciones para cuotas sin interés (asumidas por el vendedor)
  const interestFreeOptions = availableInstallmentCounts.filter(
    (count) => count <= validMax,
  );

  // Opciones para cuotas fijas (financiadas con interés a cargo del comprador)
  const financedOptions = availableInstallmentCounts.map((count) => {
    if (count === 1) {
      return {
        count: 1,
        totalWithInterest: price,
        installmentAmount: price,
        surchargePct: 0,
        badgeLabel: "1 pago sin recargo",
      };
    }

    const rateObj = commissions.find((c) => c.installments === count);
    const ivaPct = Number(rateObj?.iva_pct ?? 21.0);

    // 1) Restar de la columna commission_pct la comisión en 1 cuota:
    // Ej para 2 cuotas: 16.57% - 11% = 5.57% (tasa directa de Getnet)
    const diffCommissionPct = rateObj
      ? Math.max(0, Number(rateObj.commission_pct) - baseCommissionPct)
      : (FALLBACK_GETNET_DIRECT_RATES[count] ?? 0);

    // 2) Incluir el IVA (21%) sobre esa tasa directa para calcular el recargo total:
    // Ej: 5.57% * (1 + 0.21) = 6.74%
    const surchargePctWithIva = Number(
      (diffCommissionPct * (1 + ivaPct / 100)).toFixed(2),
    );
    const surchargeRate = surchargePctWithIva / 100;

    // 3) Monto total con interés financiado y valor de cada cuota fija:
    const totalWithInterest = Math.round(price * (1 + surchargeRate));
    const installmentAmount = Math.round(totalWithInterest / count);

    return {
      count,
      totalWithInterest,
      installmentAmount,
      surchargePct: surchargePctWithIva,
      badgeLabel:
        surchargePctWithIva > 0
          ? `+${surchargePctWithIva.toFixed(2)}%`
          : "Sin recargo",
    };
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planes de Financiación">
      <div className="product-installments-modal">
        <div className="product-installments-modal__header">
          <span className="product-installments-modal__product-title">
            {productName}
          </span>
          <div className="product-installments-modal__price-badge">
            Total contado: ${price.toLocaleString("es-AR")}
          </div>
        </div>

        {installmentsEnabled ? (
          <div className="product-installments-modal__content">
            <div className="product-installments-modal__highlight-box">
              <Sparkles
                className="product-installments-modal__highlight-icon"
                size={20}
              />
              <div>
                <strong className="product-installments-modal__highlight-title">
                  ¡Hasta {validMax} cuotas sin interés!
                </strong>
                <p className="product-installments-modal__highlight-text">
                  El vendedor ofrece cuotas sin interés en este producto. Aplica
                  con todas las tarjetas bancarias procesadas (Visa, Mastercard,
                  American Express, Cabal).
                </p>
              </div>
            </div>

            {isLoading && commissions.length === 0 ? (
              <div className="product-installments-modal__loading">
                <Loader2 className="animate-spin" size={20} />
                <span>Consultando planes vigentes...</span>
              </div>
            ) : (
              <div className="product-installments-modal__list">
                {interestFreeOptions.map((count) => {
                  const installmentPrice = Math.round(price / count);
                  return (
                    <div
                      key={count}
                      className="product-installments-modal__item product-installments-modal__item--free"
                    >
                      <div className="product-installments-modal__item-main">
                        <CreditCard
                          size={18}
                          className="product-installments-modal__item-icon"
                        />
                        <div className="product-installments-modal__item-info">
                          <span className="product-installments-modal__item-count">
                            {count === 1
                              ? "1 pago único"
                              : `${count} cuotas sin interés de $${installmentPrice.toLocaleString("es-AR")}`}
                          </span>
                          <span className="product-installments-modal__item-total">
                            Total: ${price.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>
                      <span className="product-installments-modal__badge product-installments-modal__badge--success">
                        0% CFT
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="product-installments-modal__content">
            <div className="product-installments-modal__info-box">
              <AlertCircle
                className="product-installments-modal__info-icon"
                size={20}
              />
              <div>
                <strong className="product-installments-modal__info-title">
                  Pagá en 1 cuota o financiado en cuotas fijas
                </strong>
                <p className="product-installments-modal__info-text">
                  Este producto no cuenta con promoción de cuotas sin interés
                  del vendedor. Podés pagar en 1 pago sin recargo con tarjeta de
                  débito/crédito, o financiar tu compra en cuotas fijas con
                  tarjetas bancarias.
                </p>
              </div>
            </div>

            {isLoading && commissions.length === 0 ? (
              <div className="product-installments-modal__loading">
                <Loader2 className="animate-spin" size={20} />
                <span>Consultando tasas vigentes</span>
              </div>
            ) : (
              <div className="product-installments-modal__list">
                {financedOptions.map(
                  ({
                    count,
                    totalWithInterest,
                    installmentAmount,
                    surchargePct,
                    badgeLabel,
                  }) => (
                    <div
                      key={count}
                      className="product-installments-modal__item"
                    >
                      <div className="product-installments-modal__item-main">
                        <CreditCard
                          size={18}
                          className="product-installments-modal__item-icon"
                        />
                        <div className="product-installments-modal__item-info">
                          <span className="product-installments-modal__item-count">
                            {count === 1 ? "1 pago de" : `${count} cuotas de`} $
                            {installmentAmount.toLocaleString("es-AR")}
                          </span>
                          <span className="product-installments-modal__item-total">
                            {count === 1
                              ? "Sin interés con débito o crédito"
                              : `Total financiado: $${totalWithInterest.toLocaleString("es-AR")}`}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`product-installments-modal__badge ${
                          count === 1
                            ? "product-installments-modal__badge--success"
                            : "product-installments-modal__badge--neutral"
                        }`}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}

            <p className="product-installments-modal__footer-note">
              * Calculado con la tasa directa más el 21% de IVA sobre
              la financiación. Los montos de las cuotas son fijos.
            </p>
          </div>
        )}

        <div className="product-installments-modal__actions">
          <button
            type="button"
            className="btn-primary product-installments-modal__btn-close"
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
