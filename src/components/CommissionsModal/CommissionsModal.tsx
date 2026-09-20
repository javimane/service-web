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

  const { data: commissions, isLoading } = useQuery<MarketplaceCommission[]>({
    queryKey: ["marketplace-commissions"],
    queryFn: async () => {
      const res = await commerceService.commissions();
      return Array.isArray(res) ? res : [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  if (!isOpen) return null;

  // Fallback default rates if DB is empty or loading error
  const ratesList: MarketplaceCommission[] =
    commissions && commissions.length > 0
      ? commissions
      : [
          {
            id: 1,
            installments: 1,
            commission_pct: 11.0,
            iva_pct: 21.0,
            iva_commission_pct: 2.31,
            total_commission_pct: 13.31,
            description: "1 pago (débito / crédito 1 cuota / QR)",
            is_active: true,
          },
          {
            id: 2,
            installments: 2,
            commission_pct: 13.5,
            iva_pct: 21.0,
            iva_commission_pct: 2.84,
            total_commission_pct: 16.34,
            description: "2 cuotas sin interés",
            is_active: true,
          },
          {
            id: 3,
            installments: 3,
            commission_pct: 15.0,
            iva_pct: 21.0,
            iva_commission_pct: 3.15,
            total_commission_pct: 18.15,
            description: "3 cuotas sin interés",
            is_active: true,
          },
          {
            id: 4,
            installments: 6,
            commission_pct: 19.5,
            iva_pct: 21.0,
            iva_commission_pct: 4.1,
            total_commission_pct: 23.6,
            description: "6 cuotas sin interés",
            is_active: true,
          },
          {
            id: 5,
            installments: 9,
            commission_pct: 23.0,
            iva_pct: 21.0,
            iva_commission_pct: 4.83,
            total_commission_pct: 27.83,
            description: "9 cuotas sin interés",
            is_active: true,
          },
          {
            id: 6,
            installments: 12,
            commission_pct: 27.0,
            iva_pct: 21.0,
            iva_commission_pct: 5.67,
            total_commission_pct: 32.67,
            description: "12 cuotas sin interés",
            is_active: true,
          },
          {
            id: 7,
            installments: 18,
            commission_pct: 35.0,
            iva_pct: 21.0,
            iva_commission_pct: 7.35,
            total_commission_pct: 42.35,
            description: "18 cuotas sin interés",
            is_active: true,
          },
        ];

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
              Tarifas por cobro en 1 pago (débito, crédito y QR) y ventas en cuotas
              sin interés. Incluye el desglose de IVA (21%).
            </p>
          </div>
        </div>

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
          ) : (
            <table className="commissions-modal__table">
              <thead>
                <tr>
                  <th>Plan de Venta</th>
                  <th className="commissions-modal__th-right">Comisión Base</th>
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
                  const ivaCommPct = Number(
                    rate.iva_commission_pct || ((commPct * ivaPct) / 100).toFixed(2)
                  );
                  const totalCommPct = Number(
                    rate.total_commission_pct ||
                      (commPct + ivaCommPct).toFixed(2)
                  );

                  const totalDeduction = simulationAmount
                    ? Math.round((simulationAmount * totalCommPct) / 100)
                    : 0;
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
                        {commPct.toFixed(2)}%
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
                            <strong>${netReceive.toLocaleString("es-AR")}</strong>
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
              servicios, la plataforma deduce la comisión correspondiente al plan
              seleccionado por el comprador y acredita el importe neto en tu
              cuenta bancaria (CBU / CVU / Alias).
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
