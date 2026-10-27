"use client";

import { useCardPaymentConfig } from "@/hooks/useCardPaymentConfig";
import { getCardConfig, tokenizePayway, validateCardholder } from "@/services/cardPayments";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
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
import { calculateInstallmentFinancing } from "@/utils/installmentFinancing";
import WhatsAppContactButton from "@/components/WhatsAppContactButton/WhatsAppContactButton";
import { requestIdentityVerification } from "@/utils/identityVerification";
import "./ServicePaymentModal.css";
import CheckoutItemDetails from "@/components/CheckoutItemDetails/CheckoutItemDetails";
import CheckoutFinancialCost from "@/components/CheckoutFinancialCost/CheckoutFinancialCost";
import PaymentAddressCard from "@/components/PaymentAddressCard/PaymentAddressCard";
import QrPaymentConfirmedModal from "@/components/QrPaymentConfirmedModal/QrPaymentConfirmedModal";
import { isQrPaymentConfirmed, useQrPaymentStatus } from "@/hooks/useQrPaymentStatus";

interface ServicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  professionalId: number | string;
  professionalName?: string;
  professionalPhone?: string;
  pageMode?: boolean;
}

export default function ServicePaymentModal({
  isOpen,
  onClose,
  service,
  professionalId,
  professionalName = "Comercio o Profesional",
  professionalPhone,
  pageMode = false,
}: ServicePaymentModalProps) {
  const router = useRouter();
  const { data: cardConfig } = useCardPaymentConfig();
  const { user, isAgeVerified } = useAuth();
  const { showSuccess, showError, showAlert } = useAlert();

  // Quantity
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const allowedLocationIds: string[] = service?.service_location_ids ?? [];
  const { data: professionalLocations = [] } = useQuery({
    queryKey: ["service-locations", professionalId],
    queryFn: () => commerceService.professionalLocations(Number(professionalId)),
    enabled: isOpen && allowedLocationIds.length > 0 && Number(professionalId) > 0,
  });
  const availableLocations = professionalLocations.filter((location) =>
    allowedLocationIds.includes(location.id));

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "paycloud_qr"
  >("card");
  const [installments, setInstallments] = useState<number>(1);

  // Card details (Getnet)
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardDni, setCardDni] = useState("");
  const [billingAddressId, setBillingAddressId] = useState('');
  const [billingAddressComplete, setBillingAddressComplete] = useState(false);
  const [cardType, setCardType] = useState<"credit" | "debit">("credit");

  // Submission & Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const submittingRef = useRef(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [activeQr, setActiveQr] = useState<PayCloudQrResponse | null>(null);
  const [qrPaymentConfirmed, setQrPaymentConfirmed] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(900);
  const { data: qrOrder } = useQrPaymentStatus(activeQr?.order_id, isOpen);

  useEffect(() => {
    if (!activeQr || !isQrPaymentConfirmed(qrOrder?.status)) return;
    setActiveQr(null);
    setQrPaymentConfirmed(true);
  }, [activeQr, qrOrder?.status]);
  const { data: commissionRates = [] } = useQuery({
    queryKey: ["public-marketplace-commissions"],
    queryFn: commerceService.publicCommissions,
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });
  const {
    data: serverQuote,
    isLoading: quoteLoading,
    isError: quoteError,
  } = useQuery({
    queryKey: ["service-checkout-quote", service?.id, quantity, installments],
    queryFn: () => commerceService.calculateServiceCheckout(String(service.id), quantity, installments),
    enabled: isOpen && Boolean(user) && Boolean(service?.id) &&
      paymentMethod === "card" && installments > 1,
    staleTime: 1000 * 30,
  });

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setActiveQr(null);
      setQrPaymentConfirmed(false);
      setQuantity(1);
      setInstallments(1);
      setSelectedLocationId("");
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

  const firstImage = service?.Images?.[0] ?? service?.images?.[0] ?? service?.image_url;
  const serviceImage = typeof firstImage === "string"
    ? firstImage : firstImage?.image_url ?? firstImage?.url ??
      service?.professional?.profile?.avatar_url ?? service?.Professional?.Profile?.avatar_url;

  // Price calculations
  const unitPrice = Number(service.price ?? service.base_price ?? 0);
  const baseTotal = unitPrice * quantity;

  // Installments configuration
  const installmentsEnabled = Boolean(service.installments_enabled);
  const maxInstallments = installmentsEnabled
    ? Math.max(1, Number(service.max_installments || 1))
    : 18;

  // Available installment plans
  const installmentOptions = service.category?.no_installments
    ? [1]
    : installmentsEnabled
    ? [1, 2, 3, 6, 9, 12, 18].filter((n) => n <= maxInstallments &&
        (n === 1 || commissionRates.some((rate) => Number(rate.installments) === n)))
    : [1, ...commissionRates
        .map((rate) => Number(rate.installments))
        .filter((n) => n > 1 && [2, 3, 6, 9, 12, 18].includes(n))];
  const financedQuote = !installmentsEnabled && installments > 1
    ? calculateInstallmentFinancing(baseTotal, installments, commissionRates)
    : null;
  const totalToPay = paymentMethod === "card" && installments > 1
    ? Number(serverQuote?.totalAmount ?? financedQuote?.totalAmount ?? baseTotal)
    : baseTotal;

  // Card input formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 19);
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
    if (submittingRef.current) return;

    if (!user) {
      showError("Debes iniciar sesión para contratar este servicio.");
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    if (!isAgeVerified) {
      requestIdentityVerification();
      return;
    }
    if (allowedLocationIds.length && !availableLocations.some((location) => location.id === selectedLocationId)) {
      showError("Elegí la sucursal donde se realizará el servicio.");
      return;
    }

    if (totalToPay <= 0) {
      showError("El monto del servicio debe ser mayor a $0.");
      return;
    }
    if (paymentMethod === "card" && installments > 1 &&
        (quoteLoading || quoteError || !serverQuote)) {
      showError("No se pudo confirmar el importe vigente de las cuotas. Intentá nuevamente.");
      return;
    }

    if (paymentMethod === "card") {
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

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      let token = `gn_tok_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      let paywayData = {};
      let refreshPayment: (() => ReturnType<typeof tokenizePayway>) | undefined;
      let providerMethod: 'getnet_card' | 'payway_card' = 'getnet_card';
      if (paymentMethod === 'card') {
        const config = await getCardConfig();
        if (config.provider === 'payway') {
          if (!billingAddressId || !billingAddressComplete) throw new Error('Seleccioná o completá la dirección del comprador antes de pagar.');
          refreshPayment = () => tokenizePayway(config, { number: cardNumber, holder: cardHolder.trim(),
            dni: cardDni.trim(), expiry: cardExpiry, cvv: cardCvv, type: cardType });
          const prepared = await refreshPayment();
          token = prepared.card_token;
          paywayData = prepared;
          providerMethod = 'payway_card';
        } else {
          await validateCardholder(cardHolder, cardDni);
        }
      }
      const res = await commerceService.checkout({
        ...paywayData, save_card: providerMethod === 'payway_card' && saveCard,
        professional_id: Number(professionalId || 0),
        service_id: String(service.id),
        quantity: quantity,
        delivery_type: "coordinate_with_merchant",
        ...(selectedLocationId.startsWith("main:")
          ? { origin_address_id: availableLocations.find((location) => location.id === selectedLocationId)?.address_id ?? undefined }
          : selectedLocationId ? { branch_id: selectedLocationId } : {}),
        billing_address_id: providerMethod === 'payway_card' ? billingAddressId : undefined,
        shipping_cost: 0,
        payment_method:
          paymentMethod === "card" ? providerMethod : "paycloud_qr",
        ...(providerMethod === 'getnet_card' && paymentMethod === 'card'
          ? { card_holder_name: cardHolder.trim(), card_holder_dni: cardDni.trim() }
          : {}),
        card_token: paymentMethod === "card" ? token : undefined,
        installments: paymentMethod === "card" ? installments : 1,
        expected_total_amount: totalToPay,
        card_details:
          paymentMethod === "card" && providerMethod === 'getnet_card'
            ? {
                card_number: cardNumber.replace(/\s/g, "").slice(-4),
                cardholder_name: cardHolder.trim(),
                expiration: cardExpiry,
                cvv: cardCvv,
                dni: cardDni.trim(),
              }
            : undefined,
      }, { refreshPayment });

      if (paymentMethod === "paycloud_qr" && res.qr) {
        setActiveQr(res.qr);
        setQrSecondsLeft(900);
      } else {
        setCompletedOrder({ ...res.order, card_saved: res.card_saved, save_requested: providerMethod === 'payway_card' && saveCard });
        showSuccess(res.payment_status === 'approved' ? '¡Pago procesado con éxito!' : 'Estamos verificando tu pago. Consultá Mis Compras sin volver a pagar.');
      }
    } catch (err: any) {
      if (err?.data?.error_code === "CHECKOUT_REQUIRES_VERIFICATION") {
        const orderId = err.data.order_id;
        showAlert({
          type: "warning",
          title: "Estamos verificando tu pago",
          message: "Consultá el estado de tu pedido en Mis Compras. No vuelvas a pagar mientras se confirma.",
          confirmText: "Ir a Mis Compras",
          onConfirm: () => {
            if (!pageMode) onClose();
            router.push(`/panel?view=purchases${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ""}`);
          },
        });
      } else {
        showError(err?.message || "No se pudo procesar el pago. Intenta nuevamente.");
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleContactMerchant = () => {
    const orderRef = completedOrder?.id || "";
    const msg = `Hola ${professionalName}, acabo de contratar el servicio "${service.name}"${
      orderRef ? ` (Orden #${orderRef})` : ""
    }. Quisiera coordinar la asignación del turno. ¡Muchas gracias!`;
    if (!pageMode) onClose();
    router.push(
      `/mensajes?professionalId=${professionalId}&initialMessage=${encodeURIComponent(
        msg,
      )}`,
    );
  };

  const content = (
      <div className={`service-payment-modal${pageMode ? " service-payment-modal--page" : ""}`}>
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
                  if (!pageMode) onClose();
                  router.push("/panel?view=purchases");
                }}
              >
                <CheckCircle2 size={18} />
                <span>Consultar en Mis Compras</span>
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
              {completedOrder.status === 'paid' ? '¡Pago confirmado!' : 'Pago pendiente de confirmación'}
            </h3>

            {/* Required Shift Assignment Notice */}
            {completedOrder.status === 'paid' && completedOrder.save_requested && !completedOrder.card_saved &&
              <p>El pago fue confirmado, pero no se pudo guardar la tarjeta. Volvé a consultar el pago desde Mis Compras.</p>}
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
                  ${Number(completedOrder.total_amount ?? totalToPay).toLocaleString("es-AR")}
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
              <WhatsAppContactButton
                professionalId={professionalId}
                phone={professionalPhone}
                message={`Hola, acabo de contratar el servicio ${service?.name || ""}.`}
              />
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
                  if (!pageMode) onClose();
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
            <div className="service-payment-modal__checkout-grid">
              <div className="service-payment-modal__checkout-main">
                <h2 className="service-payment-modal__panel-title">Tu servicio</h2>
            {/* Service & Provider Header Banner */}
            <div className="service-payment-modal__service-card">
              {serviceImage && <Image
                src={serviceImage}
                alt={service.name || "Servicio"}
                width={96}
                height={96}
                className="service-payment-modal__service-image"
                unoptimized
              />}
              <div className="service-payment-modal__service-info">
                <h4 className="service-payment-modal__service-name">
                  {service.name}
                </h4>
                <CheckoutItemDetails description={service.description} />
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
                    x {quantity} unid. = ${baseTotal.toLocaleString("es-AR")}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            {allowedLocationIds.length > 0 && (
              <div className="service-payment-modal__field">
                <label className="service-payment-modal__label" htmlFor="service-location">
                  Sucursal donde se realizará el servicio *
                </label>
                <select id="service-location" className="service-payment-modal__select" value={selectedLocationId}
                  onChange={(event) => setSelectedLocationId(event.target.value)} required>
                  <option value="">Elegí una sucursal</option>
                  {availableLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} — {location.street_name} {location.street_number ?? ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

              <div className="service-payment-modal__shift-notice">
                <Calendar size={20} className="service-payment-modal__shift-notice-icon" />
                <p className="service-payment-modal__shift-notice-text">
                  Una vez realizado el pago, el Comercio o Profesional te asignará un turno y podrás contactarte de forma directa.
                </p>
              </div>
              </div>
              <div className="service-payment-modal__checkout-payment">
                <h2 className="service-payment-modal__panel-title">Pago</h2>
                {user && paymentMethod === 'card' && cardConfig?.provider === 'payway' &&
                  <PaymentAddressCard onChange={(id, complete) => {
                    setBillingAddressId(id); setBillingAddressComplete(complete);
                  }} />}

            {/* Payment Method Selector */}
            <div className="service-payment-modal__field">
              <label className="service-payment-modal__label">
                Forma de pago:
              </label>
              <div className="service-payment-modal__method-selector">
                <button
                  type="button"
                  className={`service-payment-modal__method-btn ${
                    paymentMethod === "card"
                      ? "service-payment-modal__method-btn--active"
                      : ""
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <CreditCard size={20} />
                  <div className="service-payment-modal__method-info">
                    <strong>Tarjeta de Crédito / Débito</strong>
                    <span>
                      {service.category?.no_installments
                        ? "Solo 1 pago"
                        : installmentsEnabled
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
            {paymentMethod === 'card' && cardConfig?.provider === 'payway' && (
              <label><input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} /> Guardar tarjeta después del pago</label>
            )}
            {paymentMethod === "card" && (
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
                          ? `1 pago de $${baseTotal.toLocaleString("es-AR")}`
                          : installmentsEnabled
                            ? `${opt} cuotas sin interés de $${Number((baseTotal / opt).toFixed(2)).toLocaleString("es-AR")}`
                            : (() => {
                                const quote = calculateInstallmentFinancing(baseTotal, opt, commissionRates);
                                return quote
                                  ? `${opt} cuotas de $${Number((quote.totalAmount / opt).toFixed(2)).toLocaleString("es-AR")} (+${quote.surchargePct.toLocaleString("es-AR")}% recargo)`
                                  : `${opt} cuotas con recargo`;
                              })()}
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

                {cardConfig?.provider === 'payway' && <div className="service-payment-modal__field">
                  <label className="service-payment-modal__label" htmlFor="service-card-type">Tipo de tarjeta:</label>
                  <select id="service-card-type" className="service-payment-modal__input" value={cardType}
                    onChange={(event) => {
                      setCardType(event.target.value as 'credit' | 'debit');
                      if (event.target.value === 'debit') setInstallments(1);
                    }}>
                    <option value="credit">Crédito</option>
                    <option value="debit">Débito</option>
                  </select>
                </div>}
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
            <div className="service-payment-modal__purchase-summary">
              <h3 className="service-payment-modal__purchase-summary-title">Resumen de compra</h3>
              <div className="service-payment-modal__summary-row">
                <span>Subtotal ({quantity} un.)</span>
                <strong>${baseTotal.toLocaleString("es-AR")}</strong>
              </div>
              <CheckoutFinancialCost
                totalAmount={totalToPay}
                financingAmount={paymentMethod === "card" && installments > 1
                  ? serverQuote?.financingSurchargeAmount ?? (installmentsEnabled ? 0 :
                    financedQuote ? financedQuote.totalAmount - baseTotal : null)
                  : 0}
                installments={installments}
                paymentMethod={paymentMethod}
                pending={paymentMethod === "card" && installments > 1 && (quoteLoading || quoteError || !serverQuote)}
              />
              {paymentMethod === "card" && installments > 1 && quoteError && (
                <p className="service-payment-modal__financing-breakdown">
                  No pudimos confirmar el importe de las cuotas. Intentá nuevamente.
                </p>
              )}
              <div className="service-payment-modal__footer-total">
                <span className="service-payment-modal__total-label">
                  Total a abonar:
                </span>
                <span className="service-payment-modal__total-val">
                  ${totalToPay.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
            <div className="service-payment-modal__footer">
              <button
                type="submit"
                className="service-payment-modal__btn-primary"
                disabled={isSubmitting || totalToPay <= 0 ||
                  (paymentMethod === "card" && cardConfig?.provider === "payway" && !billingAddressComplete) ||
                  (paymentMethod === "card" && installments > 1 &&
                    (quoteLoading || quoteError || !serverQuote))}
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
              </div>
            </div>
          </form>
        )}
      </div>
  );
  return (
    <>
      {pageMode ? content : (
        <Modal isOpen={isOpen} onClose={onClose} title="Contratar Servicio">{content}</Modal>
      )}
      {qrPaymentConfirmed && (
        <QrPaymentConfirmedModal
          isOpen
          onContinue={() => {
            setQrPaymentConfirmed(false);
            if (!pageMode) onClose();
            router.push("/panel?view=purchases");
          }}
        />
      )}
    </>
  );
}
