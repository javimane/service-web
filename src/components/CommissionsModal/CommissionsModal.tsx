"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Percent,
  CheckCircle2,
  HelpCircle,
  Calculator,
  Loader2,
  DollarSign,
  Info,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import {
  commerceService,
  MarketplaceCommission,
} from "@/services/commerceService";
import "./CommissionsModal.css";

interface CommissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function CommissionsModal({
  isOpen,
  onClose,
  title = "Comisiones por Venta",
}: CommissionsModalProps) {
  const [simulationAmount, setSimulationAmount] = useState<number>(10000);

  const {
    data: commissions = [],
    isLoading,
    isError,
  } = useQuery<MarketplaceCommission[]>({
    queryKey: ["marketplace-commissions"],
    queryFn: async () => {
      const res = await commerceService.commissions();
      return Array.isArray(res) ? res : [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  if (!isOpen) return null;

  const ratesList = commissions;
  const benefitPct = ratesList[0]?.commission_benefit_pct ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="commissions-modal">
        {/* Header Hero */}
        <div className="commissions-modal__hero">
          <div className="commissions-modal__hero-icon">
            <Percent size={28} />
          </div>
          <div className="commissions-modal__hero-info">
            <h3 className="commissions-modal__hero-title">
              Esquema de Comisiones por Venta
            </h3>
            <p className="commissions-modal__hero-subtitle">
              Tarifas por cobro en 1 pago (débito, crédito y QR) y ventas en
              cuotas sin interés. Incluye el desglose de IVA (21%).
            </p>
          </div>
        </div>

        {benefitPct > 0 && (
          <div className="commissions-modal__benefit" role="status">
            <Percent size={18} aria-hidden="true" />
            <span>
              <strong>Beneficio de Comisiones:</strong> ya aplicamos tu
              descuento de {benefitPct.toLocaleString("es-AR")} puntos
              porcentuales a cada tasa.
            </span>
          </div>
        )}

        {/* Simulator Box */}
        <div className="commissions-modal__simulator">
          <div className="commissions-modal__simulator-header">
            <div className="commissions-modal__simulator-label">
              <Calculator size={16} />
              <span>Simulador de cobro neto:</span>
            </div>
            <div className="commissions-modal__simulator-input-wrap">
              <span className="commissions-modal__simulator-currency">$</span>
              <input
                type="number"
                min="100"
                step="500"
                value={simulationAmount || ""}
                onChange={(e) =>
                  setSimulationAmount(Math.max(0, Number(e.target.value)))
                }
                className="commissions-modal__simulator-input"
                placeholder="10000"
              />
            </div>
          </div>
        </div>

        {/* Rates Table */}
        <div className="commissions-modal__table-wrap">
          {isLoading ? (
            <div className="commissions-modal__loading">
              <Loader2 className="animate-spin" size={24} />
              <span>Cargando comisiones vigentes...</span>
            </div>
          ) : isError || ratesList.length === 0 ? (
            <p role="status">
              No se pudieron consultar las comisiones vigentes.
            </p>
          ) : (
            <table className="commissions-modal__table">
              <thead>
                <tr>
                  <th>Plan de Venta</th>
                  <th className="commissions-modal__th-right">Comisión</th>
                  <th className="commissions-modal__th-right">IVA (21%)</th>
                  <th className="commissions-modal__th-right">Total c/IVA</th>
                  {simulationAmount > 0 && (
                    <>
                      <th className="commissions-modal__th-right">Retención</th>
                      <th className="commissions-modal__th-right commissions-modal__th-net">
                        Recibís Neto
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {ratesList.map((rate) => {
                  const commPct = Number(rate.commission_pct);
                  const ivaPct = Number(rate.iva_pct || 21.0);
                  const effectivePct = Number(
                    rate.effective_commission_pct ?? commPct,
                  );
                  const ivaCommPct = Number(
                    ((effectivePct * ivaPct) / 100).toFixed(2),
                  );
                  const totalCommPct = Number(
                    (effectivePct + ivaCommPct).toFixed(2),
                  );
                  const commissionAmount =
                    Math.round(simulationAmount * effectivePct) / 100;
                  const ivaAmount = Math.round(commissionAmount * ivaPct) / 100;
                  const totalDeduction =
                    Math.round((commissionAmount + ivaAmount) * 100) / 100;
                  const netReceive = simulationAmount
                    ? simulationAmount - totalDeduction
                    : 0;

                  const isOnePayment = rate.installments === 1;

                  return (
                    <tr
                      key={rate.installments}
                      className={
                        isOnePayment ? "commissions-modal__row--highlight" : ""
                      }
                    >
                      <td className="commissions-modal__cell-plan">
                        <div className="commissions-modal__plan-badge">
                          <strong>
                            {isOnePayment
                              ? "1 Pago"
                              : `${rate.installments} Cuotas`}
                          </strong>
                          <span>
                            {rate.description ||
                              (isOnePayment
                                ? "Débito / Crédito / QR"
                                : "Sin interés")}
                          </span>
                        </div>
                      </td>
                      <td className="commissions-modal__td-right">
                        <span className="commissions-modal__commission-values">
                          {benefitPct > 0 && (
                            <>
                              <span className="commissions-modal__base-rate">
                                {commPct.toFixed(2)}%
                              </span>
                              <span
                                className="commissions-modal__discount"
                                title="Descuento sobre la comisión base"
                              >
                                −{benefitPct.toLocaleString("es-AR")} puntos
                              </span>
                            </>
                          )}
                          <strong className="commissions-modal__effective-rate">
                            {effectivePct.toFixed(2)}%
                          </strong>
                        </span>
                      </td>
                      <td className="commissions-modal__td-right">
                        +{ivaCommPct.toFixed(2)}%
                      </td>
                      <td className="commissions-modal__td-right commissions-modal__td-total-pct">
                        <strong>{totalCommPct.toFixed(2)}%</strong>
                      </td>
                      {simulationAmount > 0 && (
                        <>
                          <td className="commissions-modal__td-right commissions-modal__td-deduction">
                            -${totalDeduction.toLocaleString("es-AR")}
                          </td>
                          <td className="commissions-modal__td-right commissions-modal__td-net">
                            <strong>
                              ${netReceive.toLocaleString("es-AR")}
                            </strong>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Info callout */}
        <div className="commissions-modal__callout">
          <Info size={18} className="commissions-modal__callout-icon" />
          <div className="commissions-modal__callout-body">
            <strong>¿Cómo se aplican estas comisiones?</strong>
            <p>
              El IVA del 21% se calcula sobre el monto de la comisión de la
              plataforma. Si activás cuotas sin interés en tus productos o
              servicios, la plataforma deduce la comisión correspondiente al
              plan seleccionado por el comprador. El simulador aplica tu
              beneficio de comisiones, si corresponde, y muestra el importe neto
              estimado.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="commissions-modal__footer">
          <button
            type="button"
            className="commissions-modal__btn-close"
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
