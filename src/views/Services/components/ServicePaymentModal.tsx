"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  QrCode,
  Calendar,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import {
  commerceService,
  PayCloudQrResponse,
} from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import OrderBillingDataCard from "@/components/OrderBillingDataCard/OrderBillingDataCard";
import ReturnsPolicyLink from "@/components/ReturnsPolicyLink/ReturnsPolicyLink";
import "./ServicePaymentModal.css";

interface ServicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  professionalId: number | string;
  professionalName?: string;
  professionalPhone?: string;
}

export default function ServicePaymentModal({
  isOpen,
  onClose,
  service,
  professionalId,
  professionalName = "Comercio o Profesional",
}: ServicePaymentModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();

  // Quantity
  const [quantity, setQuantity] = useState<number>(1);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<
    "getnet_card" | "paycloud_qr"
  >("getnet_card");
  const [installments, setInstallments] = useState<number>(1);

  // Card details (Getnet)
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardDni, setCardDni] = useState("");

  // Submission & Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [activeQr, setActiveQr] = useState<PayCloudQrResponse | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(900);

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setActiveQr(null);
      setQuantity(1);
      setInstallments(1);
    }
  }, [isOpen]);

  // QR countdown timer
  useEffect(() => {
    if (!activeQr || qrSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQr, qrSecondsLeft]);

  if (!isOpen || !service) return null;

  // Price calculations
  const unitPrice = Number(service.price ?? service.base_price ?? 0);
  const totalToPay = unitPrice * quantity;

  // Installments configuration
  const installmentsEnabled = service.installments_enabled !== false;
  const maxInstallments = Math.max(1, Number(service.max_installments || 12));

  // Available installment plans
  const installmentOptions = [1, 3, 6, 9, 12, 18].filter(
    (n) => n <= maxInstallments,
  );

  // Card input formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDni(e.target.value.replace(/\D/g, "").slice(0, 9));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showError("Debes iniciar sesión para contratar este servicio.");
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    if (totalToPay <= 0) {
      showError("El monto del servicio debe ser mayor a $0.");
      return;
    }

    if (paymentMethod === "getnet_card") {
      const cleanCard = cardNumber.replace(/\s/g, "");
      if (cleanCard.length < 15) {
        showError("Ingresa un número de tarjeta válido (15 o 16 dígitos).");
        return;
      }
      if (!cardHolder.trim()) {
        showError("Ingresa el nombre del titular de la tarjeta.");
        return;
      }
      if (cardExpiry.length < 5) {
        showError("Fecha de vencimiento inválida (MM/AA).");
        return;
      }
      if (cardCvv.length < 3) {
        showError("Código de seguridad (CVV) inválido.");
        return;
      }
      if (!cardDni.trim()) {
        showError("Ingresa el DNI del titular.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = `gn_tok_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const res = await commerceService.checkout({
        professional_id: Number(professionalId || 0),
        service_id: String(service.id),
        quantity: quantity,
        delivery_type: "coordinate_with_merchant",
        shipping_cost: 0,
        payment_method:
          paymentMethod === "getnet_card" ? "getnet_card" : "paycloud_qr",
        card_token: paymentMethod === "getnet_card" ? token : undefined,
        installments: paymentMethod === "getnet_card" ? installments : 1,
        card_details:
          paymentMethod === "getnet_card"
            ? {
                card_number: cardNumber.replace(/\s/g, "").slice(-4),
                cardholder_name: cardHolder.trim(),
                expiration: cardExpiry,
                cvv: cardCvv,
                dni: cardDni.trim(),
              }
            : undefined,
      });

      if (paymentMethod === "paycloud_qr" && res.qr) {
        setActiveQr(res.qr);
        setQrSecondsLeft(900);
      } else {
        setCompletedOrder(res.order || { id: `ORD-${Date.now()}` });
        showSuccess("¡Pago procesado con éxito!");
      }
    } catch (err: any) {
      showError(
        err?.message || "No se pudo procesar el pago. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactMerchant = () => {
    const orderRef = completedOrder?.id || "";
    const msg = `Hola ${professionalName}, acabo de contratar el servicio "${service.name}"${
      orderRef ? ` (Orden #${orderRef})` : ""
    }. Quisiera coordinar la asignación del turno. ¡Muchas gracias!`;
    onClose();
    router.push(
      `/mensajes?professionalId=${professionalId}&initialMessage=${encodeURIComponent(
        msg,
      )}`,
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contratar Servicio">
      <div className="service-payment-modal">
        {/* Active QR View */}
        {activeQr ? (
          <div className="service-payment-modal__qr-view">
            <div className="service-payment-modal__qr-badge">
              <Clock size={16} />
              <span>
                Tiempo para abonar:{" "}
                <strong>
                  {Math.floor(qrSecondsLeft / 60)}:
                  {String(qrSecondsLeft % 60).padStart(2, "0")}
                </strong>
              </span>
            </div>

            <h3 className="service-payment-modal__qr-title">
              Escaneá el código QR interoperable
            </h3>
            <p className="service-payment-modal__qr-subtitle">
              Abrí tu app favorita (Mercado Pago, MODO, Cuenta DNI, Ualá, BNA+,
              Santander, etc.) y aboná al instante.
            </p>

            <div className="service-payment-modal__qr-frame">
              {activeQr.qr_image_url ? (
                <img
                  src={activeQr.qr_image_url}
                  alt="QR de Pago"
                  className="service-payment-modal__qr-img"
                />
              ) : (
                <div className="service-payment-modal__qr-placeholder">
                  <QrCode size={160} />
                </div>
              )}
            </div>

            <div className="service-payment-modal__qr-amount-box">
              <span>Total a transferir:</span>
              <strong>
                ${(activeQr.total_amount || totalToPay).toLocaleString("es-AR")}
              </strong>
            </div>

            {/* Shift Assignment Notice for QR */}
            <div className="service-payment-modal__shift-notice service-payment-modal__shift-notice--inline">
              <Calendar
                size={20}
                className="service-payment-modal__shift-notice-icon"
              />
              <p className="service-payment-modal__shift-notice-text">
                Una vez confirmado el pago, el Comercio o Profesional te
                asignará el turno correspondiente.
              </p>
            </div>

            <div className="service-payment-modal__qr-actions">
              <button
                type="button"
                className="service-payment-modal__btn-primary"
                onClick={() => {
                  setCompletedOrder({
                    id: activeQr.order_id || `ORD-${Date.now()}`,
                  });
                  setActiveQr(null);
                }}
              >
                <CheckCircle2 size={18} />
                <span>Ya realicé el pago</span>
              </button>
            </div>
            <ReturnsPolicyLink />
          </div>
        ) : completedOrder ? (
          /* Payment Success View */
          <div className="service-payment-modal__success-view">
            <div className="service-payment-modal__success-icon-wrap">
              <CheckCircle2
                size={56}
                className="service-payment-modal__success-icon"
              />
            </div>

            <h3 className="service-payment-modal__success-title">
              ¡Pago procesado con éxito!
            </h3>

            {/* Required Shift Assignment Notice */}
            <div className="service-payment-modal__shift-card">
              <Calendar
                size={28}
                className="service-payment-modal__shift-card-icon"
              />
              <div className="service-payment-modal__shift-card-content">
                <strong className="service-payment-modal__shift-card-title">
                  Asignación de turno
                </strong>
                <p className="service-payment-modal__shift-card-desc">
                  El Comercio o Profesional le va a asignar un turno para la
                  prestación del servicio.
                </p>
              </div>
            </div>

            <div className="service-payment-modal__summary-card">
              <div className="service-payment-modal__summary-row">
                <span>Servicio:</span>
                <strong>{service?.name}</strong>
              </div>
              <div className="service-payment-modal__summary-row">
                <span>Profesional / Comercio:</span>
                <strong>{professionalName}</strong>
              </div>
              <div className="service-payment-modal__summary-row">
                <span>Monto abonado:</span>
                <strong className="service-payment-modal__summary-total">
                  ${totalToPay.toLocaleString("es-AR")}
                </strong>
              </div>
              {completedOrder.id && (
                <div className="service-payment-modal__summary-row">
                  <span>N° de Orden:</span>
                  <span className="service-payment-modal__order-code">
                    #{completedOrder.id}
                  </span>
                </div>
              )}
            </div>

            {/* Post-Purchase Billing Data Card */}
            {completedOrder.id && (
              <OrderBillingDataCard
                orderId={completedOrder.id}
                initialBillingData={completedOrder.billing_data}
              />
            )}

            <div className="service-payment-modal__success-actions">
              <button
                type="button"
                className="service-payment-modal__btn-primary"
                onClick={handleContactMerchant}
              >
                <MessageCircle size={18} />
                <span>Contactar con el Comercio o Profesional</span>
              </button>

              <button
                type="button"
                className="service-payment-modal__btn-secondary"
                onClick={() => {
                  onClose();
                  router.push("/panel?view=purchases");
                }}
              >
                <ShoppingBag size={18} />
                <span>Ver en Mis Compras</span>
              </button>
            </div>
            <ReturnsPolicyLink />
          </div>
        ) : (
          /* Payment Form View (No Shipping) */
          <form
            onSubmit={handleSubmitPayment}
            className="service-payment-modal__form"
          >
            {/* Service & Provider Header Banner */}
            <div className="service-payment-modal__service-card">
              <div className="service-payment-modal__service-info">
                <h4 className="service-payment-modal__service-name">
                  {service.name}
                </h4>
                <p className="service-payment-modal__service-provider">
                  Ofrecido por: <strong>{professionalName}</strong>
                </p>
              </div>
              <div className="service-payment-modal__service-price">
                <span className="service-payment-modal__service-price-amount">
                  ${unitPrice.toLocaleString("es-AR")}
                </span>
                {quantity > 1 && (
                  <span className="service-payment-modal__service-price-unit">
                    x {quantity} unid. = ${totalToPay.toLocaleString("es-AR")}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="service-payment-modal__field">
              <label className="service-payment-modal__label">
                Cantidad de servicios:
              </label>
              <div className="service-payment-modal__qty-wrap">
                <button
                  type="button"
                  className="service-payment-modal__qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="service-payment-modal__qty-val">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="service-payment-modal__qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="service-payment-modal__field">
              <label className="service-payment-modal__label">
                Forma de pago:
              </label>
              <div className="service-payment-modal__method-selector">
                <button
                  type="button"
                  className={`service-payment-modal__method-btn ${
                    paymentMethod === "getnet_card"
                      ? "service-payment-modal__method-btn--active"
                      : ""
                  }`}
                  onClick={() => setPaymentMethod("getnet_card")}
                >
                  <CreditCard size={20} />
                  <div className="service-payment-modal__method-info">
                    <strong>Tarjeta de Crédito / Débito</strong>
                    <span>
                      {installmentsEnabled
                        ? `Hasta ${maxInstallments} cuotas sin interés`
                        : "Débito o cuotas fijas"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`service-payment-modal__method-btn ${
                    paymentMethod === "paycloud_qr"
                      ? "service-payment-modal__method-btn--active"
                      : ""
                  }`}
                  onClick={() => setPaymentMethod("paycloud_qr")}
                >
                  <QrCode size={20} />
                  <div className="service-payment-modal__method-info">
                    <strong>Código QR interoperable</strong>
                    <span>MP, MODO, Cuenta DNI, bancos</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Getnet Card Details */}
            {paymentMethod === "getnet_card" && (
              <div className="service-payment-modal__card-section">
                <div className="service-payment-modal__field">
                  <label className="service-payment-modal__label">
                    Plan de Cuotas:
                  </label>
                  <select
                    className="service-payment-modal__select"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    {installmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 1
                          ? `1 pago de $${totalToPay.toLocaleString("es-AR")}`
                          : installmentsEnabled
                            ? `${opt} cuotas sin interés de $${Math.round(
                                totalToPay / opt,
                              ).toLocaleString("es-AR")}`
                            : `${opt} cuotas fijas`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="service-payment-modal__field">
                  <label className="service-payment-modal__label">
                    Número de Tarjeta:
                  </label>
                  <div className="service-payment-modal__input-icon-wrap">
                    <input
                      type="text"
                      className="service-payment-modal__input"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                    />
                    <CreditCard
                      size={18}
                      className="service-payment-modal__input-icon"
                    />
                  </div>
                </div>

                <div className="service-payment-modal__field">
                  <label className="service-payment-modal__label">
                    Nombre del Titular (como figura en la tarjeta):
                  </label>
                  <input
                    type="text"
                    className="service-payment-modal__input"
                    placeholder="JUAN PEREZ"
                    value={cardHolder}
                    onChange={(e) =>
                      setCardHolder(e.target.value.toUpperCase())
                    }
                    required
                  />
                </div>

                <div className="service-payment-modal__row-group">
                  <div className="service-payment-modal__field">
                    <label className="service-payment-modal__label">
                      Vencimiento:
                    </label>
                    <input
                      type="text"
                      className="service-payment-modal__input"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      required
                    />
                  </div>

                  <div className="service-payment-modal__field">
                    <label className="service-payment-modal__label">CVV:</label>
                    <input
                      type="password"
                      className="service-payment-modal__input"
                      placeholder="123"
                      value={cardCvv}
                      onChange={handleCvvChange}
                      required
                    />
                  </div>

                  <div className="service-payment-modal__field">
                    <label className="service-payment-modal__label">
                      DNI del Titular:
                    </label>
                    <input
                      type="text"
                      className="service-payment-modal__input"
                      placeholder="12345678"
                      value={cardDni}
                      onChange={handleDniChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notice that appointment is scheduled by merchant */}
            <div className="service-payment-modal__shift-notice">
              <Calendar
                size={20}
                className="service-payment-modal__shift-notice-icon"
              />
              <p className="service-payment-modal__shift-notice-text">
                Una vez realizado el pago, el Comercio o Profesional le va a
                asignar un turno y podrás contactarte de forma directa.
              </p>
            </div>

            {/* Protected Purchase Banner */}
            <div className="service-payment-modal__protection-badge">
              <ShieldCheck
                size={18}
                className="service-payment-modal__protection-icon"
              />
              <span>Compra protegida o te devolvemos el dinero</span>
            </div>

            {/* Total Summary & Submit Button */}
            <ReturnsPolicyLink />
            <div className="service-payment-modal__footer">
              <div className="service-payment-modal__footer-total">
                <span className="service-payment-modal__total-label">
                  Total a abonar:
                </span>
                <span className="service-payment-modal__total-val">
                  ${totalToPay.toLocaleString("es-AR")}
                </span>
              </div>

              <button
                type="submit"
                className="service-payment-modal__btn-primary"
                disabled={isSubmitting || totalToPay <= 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Procesando pago...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>
                      {paymentMethod === "paycloud_qr"
                        ? "Generar código QR"
                        : `Pagar $${totalToPay.toLocaleString("es-AR")}`}
                    </span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
