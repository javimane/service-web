"use client";

import React from "react";
import { CreditCard, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import "./ProductInstallmentsModal.css";

interface ProductInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  installmentsEnabled: boolean;
  maxInstallments: number;
  productName: string;
}

export default function ProductInstallmentsModal({
  isOpen,
  onClose,
  price,
  installmentsEnabled,
  maxInstallments,
  productName,
}: ProductInstallmentsModalProps) {
  if (!isOpen) return null;

  const validMax = Math.max(1, maxInstallments || 1);
  const possibleInstallments = [1, 3, 6, 9, 12, 18];

  // If installments are enabled (sin interés)
  const interestFreeOptions = possibleInstallments.filter((n) => n <= validMax);

  // If installments are NOT enabled (con interés simulado estándar bancario)
  const financedOptions = [
    { count: 1, surcharge: 0, label: "1 pago sin recargo" },
    { count: 3, surcharge: 0.12, label: "3 cuotas fijas" },
    { count: 6, surcharge: 0.24, label: "6 cuotas fijas" },
    { count: 12, surcharge: 0.48, label: "12 cuotas fijas" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planes de Financiación">
      <div className="product-installments-modal">
        <div className="product-installments-modal__header">
          <span className="product-installments-modal__product-title">
            {productName}
          </span>
          <div className="product-installments-modal__price-badge">
            Total: ${price.toLocaleString("es-AR")}
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
                  con todas las tarjetas de crédito bancarias (Visa, Mastercard,
                  American Express, Cabal).
                </p>
              </div>
            </div>

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
                  Pagá en 1 cuota o financiado con tarjeta
                </strong>
                <p className="product-installments-modal__info-text">
                  Este producto no cuenta con promoción de cuotas sin interés
                  del vendedor. Podés pagar en 1 pago sin recargo con tarjeta de
                  débito/crédito, o financiar tu compra en cuotas fijas.
                </p>
              </div>
            </div>

            <div className="product-installments-modal__list">
              {financedOptions.map(({ count, surcharge, label }) => {
                const totalWithInterest = Math.round(price * (1 + surcharge));
                const installmentAmount = Math.round(totalWithInterest / count);
                return (
                  <div key={count} className="product-installments-modal__item">
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
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="product-installments-modal__footer-note">
              * Tasas y recargos estimados según regulaciones financieras
              vigentes. El costo financiero definitivo se detalla al ingresar
              los datos de tu tarjeta en el pago.
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
