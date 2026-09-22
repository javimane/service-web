"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  QrCode,
  Truck,
  Store,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  ChevronRight,
  Lock,
  MapPin,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  commerceService,
  ProductVariant,
  PayCloudQrResponse,
  DeliveryType,
  CalculateShippingResponse,
  UserPaymentMethod,
} from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import OrderBillingDataCard from "@/components/OrderBillingDataCard/OrderBillingDataCard";
import "./ProductPaymentModal.css";

interface ProductPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  professionalId: number;
  professionalProductId?: string;
  variants?: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (v: ProductVariant | null) => void;
  sellerName?: string;
  sellerProvince?: string;
  isAgeRestricted?: boolean;
  canPurchase?: boolean;
}

export default function ProductPaymentModal({
  isOpen,
  onClose,
  product,
  professionalId,
  professionalProductId,
  variants = [],
  selectedVariant,
  onSelectVariant,
  sellerName,
  sellerProvince,
  isAgeRestricted = false,
  canPurchase = true,
}: ProductPaymentModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();

  // Step and flow states
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Automated shipping calculation states
  const [shippingCalc, setShippingCalc] =
    useState<CalculateShippingResponse | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] =
    useState<boolean>(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<
    "getnet_card" | "paycloud_qr"
  >("getnet_card");
  const [installments, setInstallments] = useState<number>(1);

  // Saved payment methods
  const { data: savedCards = [] } = useQuery<UserPaymentMethod[]>({
    queryKey: ["user-payment-methods"],
    queryFn: async () => {
      return await commerceService.getUserPaymentMethods();
    },
    enabled: isOpen,
  });

  const [useSavedCard, setUseSavedCard] = useState<boolean>(true);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string>("");
  const [saveCardForFuture, setSaveCardForFuture] = useState<boolean>(false);
  const [cardBank, setCardBank] = useState<string>("Santander");
  const [cardType, setCardType] = useState<"credit" | "debit">("credit");

  // Card details (Getnet)
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardDni, setCardDni] = useState("");

  useEffect(() => {
    if (savedCards && savedCards.length > 0) {
      const defaultCard = savedCards.find((c) => c.is_default) || savedCards[0];
      setSelectedSavedCardId(defaultCard.id);
      setUseSavedCard(true);
    } else {
      setUseSavedCard(false);
    }
  }, [savedCards]);

  // Results / loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [activeQr, setActiveQr] = useState<PayCloudQrResponse | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(900);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setActiveQr(null);
      setQuantity(1);
    }
  }, [isOpen]);

  // QR countdown
  useEffect(() => {
    if (!activeQr || qrSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQr, qrSecondsLeft]);

  // Automated shipping calculation
  useEffect(() => {
    if (!isOpen || deliveryType !== "shipment" || !professionalProductId) {
      if (deliveryType !== "shipment") {
        setShippingCalc(null);
      }
      return;
    }

    let isMounted = true;
    setIsCalculatingShipping(true);

    const timer = setTimeout(async () => {
      try {
        const res = await commerceService.calculateShipping({
          professional_product_id: professionalProductId,
          variant_id: selectedVariant ? selectedVariant.id : undefined,
          quantity,
          delivery_type: "shipment",
          shipping_address:
            street.trim() || city.trim()
              ? {
                  street: `${street.trim()} ${streetNumber.trim()}`.trim(),
                  number: streetNumber.trim() || undefined,
                  city: city.trim() || undefined,
                  state: sellerProvince || "Buenos Aires",
                  zip_code: zipCode.trim() || undefined,
                }
              : undefined,
        });

        if (isMounted) {
          setShippingCalc(res);
        }
      } catch (err) {
        console.warn("Shipping calculation fallback error:", err);
      } finally {
        if (isMounted) {
          setIsCalculatingShipping(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    deliveryType,
    professionalProductId,
    selectedVariant,
    quantity,
    street,
    streetNumber,
    city,
    zipCode,
    sellerProvince,
  ]);

  if (!isOpen) return null;

  // Active pricing calculation
  const basePrice = Number(product?.price || 0);
  const baseOfferPrice = product?.offer_price
    ? Number(product.offer_price)
    : null;
  const baseWholesalePrice = product?.wholesale_price
    ? Number(product.wholesale_price)
    : null;
  const baseWholesaleUnit = Number(product?.wholesale_unit || 0);

  let activeUnitPrice = baseOfferPrice || basePrice;

  if (selectedVariant && !selectedVariant.use_product_price) {
    if (
      selectedVariant.wholesale_unit &&
      quantity >= selectedVariant.wholesale_unit &&
      selectedVariant.wholesale_price
    ) {
      activeUnitPrice = Number(selectedVariant.wholesale_price);
    } else if (selectedVariant.offer_price) {
      activeUnitPrice = Number(selectedVariant.offer_price);
    } else if (selectedVariant.price) {
      activeUnitPrice = Number(selectedVariant.price);
    }
  } else {
    if (
      baseWholesaleUnit > 0 &&
      quantity >= baseWholesaleUnit &&
      baseWholesalePrice
    ) {
      activeUnitPrice = baseWholesalePrice;
    }
  }

  // Active installments conditions
  const installmentsEnabled =
    selectedVariant && selectedVariant.installments_enabled !== undefined
      ? Boolean(selectedVariant.installments_enabled)
      : Boolean(product?.installments_enabled);

  const maxInstallments =
    selectedVariant && selectedVariant.max_installments
      ? Number(selectedVariant.max_installments)
      : Number(product?.max_installments || 12);

  const subtotal = activeUnitPrice * quantity;

  // Shipping cost from automated calculation
  const calculatedShippingFee =
    deliveryType === "shipment" && shippingCalc
      ? shippingCalc.is_free_shipping
        ? 0
        : Number(shippingCalc.shipping_cost || 0)
      : 0;

  // Surcharge for non-promotional installments
  let financingSurchargeRate = 0;
  if (
    !installmentsEnabled &&
    paymentMethod === "getnet_card" &&
    installments > 1
  ) {
    if (installments === 3) financingSurchargeRate = 0.12;
    else if (installments === 6) financingSurchargeRate = 0.24;
    else if (installments === 12) financingSurchargeRate = 0.48;
  }

  const financingAmount = Math.round(subtotal * financingSurchargeRate);
  const totalToPay = subtotal + financingAmount + calculatedShippingFee;
  const installmentAmount = Math.round(totalToPay / installments);

  // Available installment choices
  const possibleCounts = [1, 3, 6, 9, 12, 18];
  const interestFreeChoices = possibleCounts.filter(
    (c) => c <= maxInstallments,
  );
  const standardChoices = [1, 3, 6, 12];

  // Card input formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  // Card brand detection
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(clean))
      return "Mastercard";
    if (/^3[47]/.test(clean)) return "American Express";
    if (/^(5896|6042|6043)/.test(clean)) return "Cabal";
    return null;
  };

  const cardBrand = getCardBrand(cardNumber);

  // Handle Checkout submission
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showError("Debes iniciar sesión para completar la compra.");
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    if (isAgeRestricted && !canPurchase) {
      showError(
        "Debes verificar tu mayoría de edad para comprar este producto.",
      );
      return;
    }

    if (deliveryType === "shipment") {
      if (!street.trim() || !city.trim() || !zipCode.trim()) {
        showError("Por favor completa los datos de entrega.");
        return;
      }
    }

    const selectedCard = savedCards.find((c) => c.id === selectedSavedCardId);

    if (paymentMethod === "getnet_card") {
      if (useSavedCard && selectedCard) {
        if (cardCvv.length > 0 && cardCvv.length < 3) {
          showError("Código de seguridad (CVV) inválido.");
          return;
        }
      } else {
        const cleanNum = cardNumber.replace(/\s/g, "");
        if (cleanNum.length < 15) {
          showError("Número de tarjeta inválido.");
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
    }

    setIsSubmitting(true);
    try {
      let token: string;
      let cardLastFour: string;
      let cardholderName: string;
      let expiration: string;

      if (paymentMethod === "getnet_card" && useSavedCard && selectedCard) {
        token = selectedCard.getnet_card_token;
        cardLastFour = selectedCard.last_four;
        cardholderName = selectedCard.card_holder_name || "TITULAR";
        expiration =
          selectedCard.expiry_month && selectedCard.expiry_year
            ? `${String(selectedCard.expiry_month).padStart(2, "0")}/${String(selectedCard.expiry_year).slice(-2)}`
            : "12/28";
      } else {
        // Simulate token generation for Getnet card
        token = `gn_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        cardLastFour = cardNumber.replace(/\s/g, "").slice(-4);
        cardholderName = cardHolder.trim();
        expiration = cardExpiry;
      }

      const res = await commerceService.checkout({
        professional_id: professionalId,
        professional_product_id: professionalProductId,
        variant_id: selectedVariant ? selectedVariant.id : undefined,
        quantity: quantity,
        delivery_type: deliveryType,
        shipping_address:
          deliveryType === "shipment"
            ? {
                street: `${street.trim()} ${streetNumber.trim()}`,
                number: streetNumber.trim() || "S/N",
                city: city.trim(),
                state: sellerProvince || "Buenos Aires",
                zip_code: zipCode.trim(),
              }
            : undefined,
        shipping_cost: calculatedShippingFee,
        payment_method:
          paymentMethod === "getnet_card" ? "getnet_card" : "paycloud_qr",
        card_token: paymentMethod === "getnet_card" ? token : undefined,
        installments: paymentMethod === "getnet_card" ? installments : 1,
        card_details:
          paymentMethod === "getnet_card"
            ? {
                card_number: cardLastFour,
                cardholder_name: cardholderName,
                expiration: expiration,
                cvv: cardCvv,
                dni: cardDni.trim() || "0",
              }
            : undefined,
      });

      if (paymentMethod === "paycloud_qr" && res.qr) {
        setActiveQr(res.qr);
        setQrSecondsLeft(900);
      } else {
        // Si pagó con tarjeta nueva y marcó guardar tarjeta
        if (
          paymentMethod === "getnet_card" &&
          !useSavedCard &&
          saveCardForFuture
        ) {
          const [mmStr, yyStr] = cardExpiry.split("/");
          commerceService
            .createUserPaymentMethod({
              getnet_card_token: token,
              last_four: cardLastFour,
              card_brand: cardBrand || "tarjeta",
              card_type: cardType,
              bank_name: cardBank,
              card_holder_name: cardholderName,
              expiry_month: parseInt(mmStr, 10) || 12,
              expiry_year: 2000 + (parseInt(yyStr, 10) || 28),
              is_default: savedCards.length === 0,
            })
            .catch((e) => console.error("Error guardando tarjeta:", e));
        }

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Compra">
      <div className="product-payment-modal">
        {/* Active QR Screen */}
        {activeQr ? (
          <div className="product-payment-modal__qr-view">
            <div className="product-payment-modal__qr-badge">
              <Clock size={16} />
              <span>
                Tiempo para abonar:{" "}
                <strong>
                  {Math.floor(qrSecondsLeft / 60)}:
                  {String(qrSecondsLeft % 60).padStart(2, "0")}
                </strong>
              </span>
            </div>

            <h3 className="product-payment-modal__qr-title">
              Escaneá el código QR interoperable
            </h3>
            <p className="product-payment-modal__qr-subtitle">
              Abrí tu app favorita (Mercado Pago, MODO, Cuenta DNI, Ualá, BNA+,
              Santander, etc.) y pagá al instante.
            </p>

            <div className="product-payment-modal__qr-frame">
              {activeQr.qr_image_url ? (
                <img
                  src={activeQr.qr_image_url}
                  alt="QR de Pago PayCloud"
                  className="product-payment-modal__qr-img"
                />
              ) : (
                <div className="product-payment-modal__qr-placeholder">
                  <QrCode size={160} />
                </div>
              )}
            </div>

            <div className="product-payment-modal__qr-amount-box">
              <span>Total a transferir:</span>
              <strong>
                ${(activeQr.total_amount || totalToPay).toLocaleString("es-AR")}
              </strong>
            </div>

            <div className="product-payment-modal__qr-actions">
              <button
                type="button"
                className="btn-primary product-payment-modal__btn-full"
                onClick={() => {
                  onClose();
                  router.push("/panel?view=purchases");
                }}
              >
                <CheckCircle2 size={18} />
                <span>Ya realicé el pago</span>
              </button>
            </div>
          </div>
        ) : completedOrder ? (
          /* Payment Success Screen */
          <div className="product-payment-modal__success-view">
            <div className="product-payment-modal__success-icon-wrap">
              <CheckCircle2
                size={56}
                className="product-payment-modal__success-icon"
              />
            </div>
            <h3 className="product-payment-modal__success-title">
              ¡Pago procesado con éxito!
            </h3>
            <p className="product-payment-modal__success-desc">
              Tu compra fue confirmada y el vendedor ha sido notificado para
              preparar tu pedido.
            </p>

            <div className="product-payment-modal__success-card">
              <div className="product-payment-modal__summary-row">
                <span>Producto:</span>
                <strong>{product?.name}</strong>
              </div>
              {selectedVariant && (
                <div className="product-payment-modal__summary-row">
                  <span>Variante:</span>
                  <strong>
                    {selectedVariant.attribute_name}:{" "}
                    {selectedVariant.attribute_value}
                  </strong>
                </div>
              )}
              <div className="product-payment-modal__summary-row">
                <span>Cantidad:</span>
                <strong>{quantity} unidad(es)</strong>
              </div>
              <div className="product-payment-modal__summary-row">
                <span>Total abonado:</span>
                <strong>${totalToPay.toLocaleString("es-AR")}</strong>
              </div>
              <div className="product-payment-modal__summary-row">
                <span>Plan:</span>
                <strong>
                  {installments === 1
                    ? "1 pago sin recargo"
                    : `${installments} cuotas de $${installmentAmount.toLocaleString("es-AR")}`}
                </strong>
              </div>
            </div>

            {/* Post-Purchase Billing Data Card */}
            {completedOrder?.id && (
              <OrderBillingDataCard
                orderId={completedOrder.id}
                initialBillingData={completedOrder.billing_data}
              />
            )}

            <button
              type="button"
              className="btn-primary product-payment-modal__btn-full"
              onClick={() => {
                onClose();
                router.push("/panel?view=purchases");
              }}
            >
              <span>Ver en Mis Compras</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <form
            className="product-payment-modal__form"
            onSubmit={handleProcessPayment}
          >
            {/* User alert if not logged in */}
            {!user && (
              <div className="product-payment-modal__auth-warning">
                <AlertTriangle size={18} />
                <span>
                  Debes iniciar sesión para comprar.{" "}
                  <button
                    type="button"
                    className="product-payment-modal__link-btn"
                    onClick={() =>
                      router.push(
                        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
                      )
                    }
                  >
                    Ingresar aquí
                  </button>
                </span>
              </div>
            )}

            {/* Age restriction alert */}
            {isAgeRestricted && !canPurchase && (
              <div className="product-payment-modal__auth-warning product-payment-modal__auth-warning--error">
                <AlertTriangle size={18} />
                <span>
                  <strong>Producto para mayores de 18 años.</strong> Tenés que
                  verificar tu edad en tu cuenta para poder comprar este
                  producto.
                </span>
              </div>
            )}

            {/* Product Summary Header */}
            <div className="product-payment-modal__product-header">
              <div className="product-payment-modal__product-info">
                <span className="product-payment-modal__product-name">
                  {product?.name}
                </span>
                <span className="product-payment-modal__seller-tag">
                  Vendedor: {sellerName || "Comercio verificado"}
                </span>
              </div>
              <div className="product-payment-modal__unit-price">
                ${activeUnitPrice.toLocaleString("es-AR")}
              </div>
            </div>

            {/* Variant selector (if product has variants) */}
            {variants.length > 0 && (
              <div className="product-payment-modal__section">
                <label className="product-payment-modal__label">
                  Variante del producto
                </label>
                <div className="product-payment-modal__variants-list">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`product-payment-modal__variant-pill ${
                          isSelected
                            ? "product-payment-modal__variant-pill--active"
                            : ""
                        }`}
                        onClick={() => onSelectVariant(v)}
                      >
                        <span>
                          {v.attribute_name}:{" "}
                          <strong>{v.attribute_value}</strong>
                        </span>
                        {v.price && !v.use_product_price && (
                          <span className="product-payment-modal__variant-price">
                            $
                            {Number(v.offer_price || v.price).toLocaleString(
                              "es-AR",
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="product-payment-modal__section">
              <label className="product-payment-modal__label">Cantidad</label>
              <div className="product-payment-modal__qty-selector">
                <button
                  type="button"
                  className="product-payment-modal__qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="product-payment-modal__qty-value">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="product-payment-modal__qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="product-payment-modal__section">
              <label className="product-payment-modal__label">
                Forma de entrega
              </label>
              <div className="product-payment-modal__delivery-options">
                <div
                  className={`product-payment-modal__delivery-card ${
                    deliveryType === "pickup"
                      ? "product-payment-modal__delivery-card--active"
                      : ""
                  }`}
                  onClick={() => setDeliveryType("pickup")}
                >
                  <Store size={18} />
                  <div>
                    <strong>Retiro en sucursal del comercio</strong>
                    <p>Gratis • Coordiná el retiro con el vendedor</p>
                  </div>
                </div>

                <div
                  className={`product-payment-modal__delivery-card ${
                    deliveryType === "shipment"
                      ? "product-payment-modal__delivery-card--active"
                      : ""
                  }`}
                  onClick={() => setDeliveryType("shipment")}
                >
                  <Truck size={18} />
                  <div>
                    <strong>Envío a domicilio</strong>
                    <p>Recibí en tu dirección</p>
                  </div>
                </div>

                <div
                  className={`product-payment-modal__delivery-card ${
                    deliveryType === "coordinate_with_merchant"
                      ? "product-payment-modal__delivery-card--active"
                      : ""
                  }`}
                  onClick={() => setDeliveryType("coordinate_with_merchant")}
                >
                  <MessageCircle size={18} />
                  <div>
                    <strong>A convenir con el vendedor</strong>
                    <p>Coordinar entrega directa</p>
                  </div>
                </div>
              </div>

              {/* Address inputs for shipment */}
              {deliveryType === "shipment" && (
                <div className="product-payment-modal__address-fields">
                  <div className="product-payment-modal__form-row">
                    <div className="product-payment-modal__form-group flex-2">
                      <label className="product-payment-modal__input-label">
                        Calle *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Av. Corrientes"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>
                    <div className="product-payment-modal__form-group flex-1">
                      <label className="product-payment-modal__input-label">
                        Número *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="1234"
                        value={streetNumber}
                        onChange={(e) => setStreetNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="product-payment-modal__form-row">
                    <div className="product-payment-modal__form-group flex-2">
                      <label className="product-payment-modal__input-label">
                        Ciudad / Localidad *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. La Plata"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="product-payment-modal__form-group flex-1">
                      <label className="product-payment-modal__input-label">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="1900"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Automated Shipping Calculation & Vehicle Box */}
                  <div className="product-payment-modal__shipping-calc-box">
                    {isCalculatingShipping ? (
                      <div className="product-payment-modal__shipping-calc-loading">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Calculando costo y logística de envío...</span>
                      </div>
                    ) : shippingCalc ? (
                      <div className="product-payment-modal__shipping-calc-content">
                        <div className="product-payment-modal__shipping-calc-header">
                          <div className="product-payment-modal__shipping-calc-meta">
                            <span className="product-payment-modal__vehicle-badge">
                              <Truck size={14} />
                              {shippingCalc.vehicle?.name || "Rider / Repartidor"}
                            </span>
                            {shippingCalc.is_night_rate && (
                              <span className="product-payment-modal__night-badge">
                                Tarifa Nocturna
                              </span>
                            )}
                            {shippingCalc.requires_heavy_vehicle && (
                              <span className="product-payment-modal__heavy-badge">
                                Carga Pesada
                              </span>
                            )}
                          </div>
                          <div className="product-payment-modal__shipping-calc-price">
                            {shippingCalc.is_free_shipping ? (
                              <span className="product-payment-modal__free-shipping-text">
                                ¡Envío Gratis!
                              </span>
                            ) : (
                              <span>
                                ${Number(shippingCalc.shipping_cost).toLocaleString("es-AR")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="product-payment-modal__shipping-calc-details">
                          <span>
                            Distancia estimada:{" "}
                            <strong>{shippingCalc.distance_km || 5} km</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Peso aprox:{" "}
                            <strong>{shippingCalc.estimated_weight_kg || 1} kg</strong>
                          </span>
                          {shippingCalc.is_free_shipping && shippingCalc.free_shipping_reason && (
                            <p className="product-payment-modal__free-reason">
                              {shippingCalc.free_shipping_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="product-payment-modal__shipping-calc-info">
                        <MapPin size={16} />
                        <span>
                          Tarifa mínima de partida: $1.500 (primer km). El costo final se calcula según distancia y peso del paquete.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="product-payment-modal__section">
              <label className="product-payment-modal__label">
                Medio de Pago
              </label>
              <div className="product-payment-modal__payment-tabs">
                <button
                  type="button"
                  className={`product-payment-modal__payment-tab ${
                    paymentMethod === "getnet_card"
                      ? "product-payment-modal__payment-tab--active"
                      : ""
                  }`}
                  onClick={() => {
                    setPaymentMethod("getnet_card");
                    setInstallments(1);
                  }}
                >
                  <CreditCard size={18} />
                  <span>Tarjeta de Crédito / Débito</span>
                </button>

                <button
                  type="button"
                  className={`product-payment-modal__payment-tab ${
                    paymentMethod === "paycloud_qr"
                      ? "product-payment-modal__payment-tab--active"
                      : ""
                  }`}
                  onClick={() => {
                    setPaymentMethod("paycloud_qr");
                    setInstallments(1);
                  }}
                >
                  <QrCode size={18} />
                  <span>QR Interoperable (PayCloud)</span>
                </button>
              </div>

              {/* Getnet Card Form & Installments */}
              {paymentMethod === "getnet_card" ? (
                <div className="product-payment-modal__card-block">
                  {/* Installments selection */}
                  <div className="product-payment-modal__form-group">
                    <label className="product-payment-modal__input-label">
                      Selecciona las cuotas
                    </label>
                    <select
                      className="product-payment-modal__select"
                      value={installments}
                      onChange={(e) =>
                        setInstallments(parseInt(e.target.value, 10))
                      }
                    >
                      {installmentsEnabled
                        ? interestFreeChoices.map((c) => {
                            const instPrice = Math.round(subtotal / c);
                            return (
                              <option key={c} value={c}>
                                {c === 1
                                  ? `1 pago de $${subtotal.toLocaleString("es-AR")}`
                                  : `${c} cuotas sin interés de $${instPrice.toLocaleString("es-AR")} (Total: $${subtotal.toLocaleString("es-AR")})`}
                              </option>
                            );
                          })
                        : standardChoices.map((c) => {
                            let rate = 0;
                            if (c === 3) rate = 0.12;
                            else if (c === 6) rate = 0.24;
                            else if (c === 12) rate = 0.48;
                            const totalW = Math.round(subtotal * (1 + rate));
                            const instPrice = Math.round(totalW / c);
                            return (
                              <option key={c} value={c}>
                                {c === 1
                                  ? `1 cuota de $${subtotal.toLocaleString("es-AR")} (sin recargo)`
                                  : `${c} cuotas fijas de $${instPrice.toLocaleString("es-AR")} (Total: $${totalW.toLocaleString("es-AR")})`}
                              </option>
                            );
                          })}
                    </select>

                    {installmentsEnabled ? (
                      <span className="product-payment-modal__installments-tag product-payment-modal__installments-tag--success">
                        ¡Promoción cuotas sin interés activada!
                      </span>
                    ) : (
                      <span className="product-payment-modal__installments-tag product-payment-modal__installments-tag--info">
                        Financiación bancaria con cuotas fijas.
                      </span>
                    )}
                  </div>

                  {/* Selector de tarjeta guardada vs nueva */}
                  {savedCards.length > 0 && (
                    <div className="product-payment-modal__form-group">
                      <label className="product-payment-modal__input-label">
                        Método de tarjeta
                      </label>
                      <div className="product-payment-modal__payment-methods-grid">
                        <button
                          type="button"
                          className={`product-payment-modal__method-btn ${
                            useSavedCard
                              ? "product-payment-modal__method-btn--active"
                              : ""
                          }`}
                          onClick={() => setUseSavedCard(true)}
                        >
                          <CreditCard size={18} />
                          <span>Tarjeta guardada ({savedCards.length})</span>
                        </button>
                        <button
                          type="button"
                          className={`product-payment-modal__method-btn ${
                            !useSavedCard
                              ? "product-payment-modal__method-btn--active"
                              : ""
                          }`}
                          onClick={() => setUseSavedCard(false)}
                        >
                          <CreditCard size={18} />
                          <span>Ingresar otra tarjeta</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Si usa tarjeta guardada */}
                  {useSavedCard && savedCards.length > 0 ? (
                    <div className="product-payment-modal__form-group">
                      <label className="product-payment-modal__input-label">
                        Selecciona tu tarjeta guardada
                      </label>
                      <select
                        className="product-payment-modal__select"
                        value={selectedSavedCardId}
                        onChange={(e) => setSelectedSavedCardId(e.target.value)}
                      >
                        {savedCards.map((sc) => {
                          const brand = (sc.card_brand || "Tarjeta").toUpperCase();
                          const bank = sc.bank_name || "Banco";
                          const type = sc.card_type === "debit" ? "Débito" : "Crédito";
                          const def = sc.is_default ? " ★ Predeterminada" : "";
                          return (
                            <option key={sc.id} value={sc.id}>
                              {bank} •••• {sc.last_four} ({brand} {type}) - {sc.card_holder_name || "Titular"}{def}
                            </option>
                          );
                        })}
                      </select>

                      <div className="product-payment-modal__form-row product-payment-modal__saved-card-row">
                        <div className="product-payment-modal__form-group flex-1">
                          <label className="product-payment-modal__input-label">
                            Cód. seg. (CVV)
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) =>
                              setCardCvv(e.target.value.replace(/\D/g, ""))
                            }
                          />
                        </div>
                        <div className="product-payment-modal__form-group flex-1">
                          <label className="product-payment-modal__input-label">
                            DNI del titular *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="38123456"
                            value={cardDni}
                            onChange={(e) =>
                              setCardDni(e.target.value.replace(/\D/g, ""))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Si ingresa tarjeta nueva */
                    <>
                      <div className="product-payment-modal__form-group">
                        <label className="product-payment-modal__input-label">
                          Número de tarjeta * {cardBrand && `(${cardBrand})`}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="4509 0000 0000 0000"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                        />
                      </div>

                      <div className="product-payment-modal__form-group">
                        <label className="product-payment-modal__input-label">
                          Nombre y apellido impreso en la tarjeta *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="JUAN PEREZ"
                          value={cardHolder}
                          onChange={(e) =>
                            setCardHolder(e.target.value.toUpperCase())
                          }
                        />
                      </div>

                      <div className="product-payment-modal__form-row">
                        <div className="product-payment-modal__form-group flex-1">
                          <label className="product-payment-modal__input-label">
                            Banco emisor
                          </label>
                          <select
                            className="product-payment-modal__select"
                            value={cardBank}
                            onChange={(e) => setCardBank(e.target.value)}
                          >
                            <option value="Santander">Santander</option>
                            <option value="Galicia">Galicia</option>
                            <option value="BBVA">BBVA</option>
                            <option value="Macro">Macro</option>
                            <option value="Banco Nación">Banco Nación</option>
                            <option value="Banco Provincia">Banco Provincia</option>
                            <option value="Mercado Pago">Mercado Pago</option>
                            <option value="Brubank">Brubank</option>
                            <option value="Ualá">Ualá</option>
                            <option value="Otro">Otro Banco</option>
                          </select>
                        </div>
                        <div className="product-payment-modal__form-group flex-1">
                          <label className="product-payment-modal__input-label">
                            Tipo
                          </label>
                          <select
                            className="product-payment-modal__select"
                            value={cardType}
                            onChange={(e) => setCardType(e.target.value as any)}
                          >
                            <option value="credit">Crédito</option>
                            <option value="debit">Débito</option>
                          </select>
                        </div>
                      </div>

                      <div className="product-payment-modal__form-row">
                        <div className="product-payment-modal__form-group flex-1">
                          <label className="product-payment-modal__input-label">
                            Vencimiento *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                          />
                        </div>
                        <div className="product-payment-modal__form-group flex-1">
                          <label className="product-payment-modal__input-label">
                            Cód. seg. (CVV) *
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) =>
                              setCardCvv(e.target.value.replace(/\D/g, ""))
                            }
                          />
                        </div>
                        <div className="product-payment-modal__form-group flex-1">
                          <label className="product-payment-modal__input-label">
                            DNI del titular *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="38123456"
                            value={cardDni}
                            onChange={(e) =>
                              setCardDni(e.target.value.replace(/\D/g, ""))
                            }
                          />
                        </div>
                      </div>

                      {/* Checkbox para guardar tarjeta */}
                      <label className="product-payment-modal__save-card-label">
                        <input
                          type="checkbox"
                          checked={saveCardForFuture}
                          onChange={(e) => setSaveCardForFuture(e.target.checked)}
                        />
                        Guardar esta tarjeta de forma segura para compras futuras
                      </label>
                    </>
                  )}
                </div>
              ) : (
                /* PayCloud QR Info Block */
                <div className="product-payment-modal__qr-info-block">
                  <QrCode
                    size={36}
                    className="product-payment-modal__qr-info-icon"
                  />
                  <div>
                    <strong>Pago en 1 cuota con Código QR interoperable</strong>
                    <p>
                      Al presionar continuar, se generará tu código QR dinámico
                      de PayCloud. Podrás escanearlo con Mercado Pago, MODO,
                      Cuenta DNI, BNA+, Ualá y cualquier billetera bancaria de
                      Argentina.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Total summary */}
            <div className="product-payment-modal__total-block">
              <div className="product-payment-modal__summary-row">
                <span>Subtotal ({quantity} un.):</span>
                <span>${subtotal.toLocaleString("es-AR")}</span>
              </div>
              {deliveryType === "shipment" && (
                <div className="product-payment-modal__summary-row">
                  <span>Costo de Envío:</span>
                  <span>
                    {calculatedShippingFee === 0 &&
                    shippingCalc?.is_free_shipping
                      ? "¡Gratis!"
                      : `$${calculatedShippingFee.toLocaleString("es-AR")}`}
                  </span>
                </div>
              )}
              {financingAmount > 0 && (
                <div className="product-payment-modal__summary-row">
                  <span>Financiación ({installments} cuotas):</span>
                  <span>+${financingAmount.toLocaleString("es-AR")}</span>
                </div>
              )}
              <div className="product-payment-modal__summary-row product-payment-modal__summary-row--total">
                <span>Total a pagar:</span>
                <div className="product-payment-modal__total-price-wrap">
                  <strong>${totalToPay.toLocaleString("es-AR")}</strong>
                  {installments > 1 && (
                    <span className="product-payment-modal__installment-preview">
                      en {installments} cuotas de $
                      {installmentAmount.toLocaleString("es-AR")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="product-payment-modal__actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary product-payment-modal__btn-submit"
                disabled={isSubmitting || (isAgeRestricted && !canPurchase)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Procesando pago...</span>
                  </>
                ) : paymentMethod === "paycloud_qr" ? (
                  <>
                    <QrCode size={18} />
                    <span>Generar código QR</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Pagar ${totalToPay.toLocaleString("es-AR")}</span>
                  </>
                )}
              </button>
            </div>

            <div className="product-payment-modal__security-note">
              <ShieldCheck size={16} />
              <span>Transacción cifrada y protegida</span>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
