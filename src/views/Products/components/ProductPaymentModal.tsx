"use client";

import { useCardPaymentConfig } from "@/hooks/useCardPaymentConfig";
import {
  getCardConfig,
  tokenizePayway,
  validateCardholder,
} from "@/services/cardPayments";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  MarketplaceCommission,
  PayCloudQrResponse,
  DeliveryType,
  CalculateShippingResponse,
  UserPaymentMethod,
  UserAddress,
  Branch,
} from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import OrderBillingDataCard from "@/components/OrderBillingDataCard/OrderBillingDataCard";
import ReturnsPolicyLink from "@/components/ReturnsPolicyLink/ReturnsPolicyLink";
import { calculateProductPricing } from "@/utils/productPricing";
import { calculateInstallmentFinancing } from "@/utils/installmentFinancing";
import { getDeliveryCoverage } from "@/utils/deliveryCoverage";
import { requestIdentityVerification } from "@/utils/identityVerification";
import "./ProductPaymentModal.css";
import CheckoutItemDetails from "@/components/CheckoutItemDetails/CheckoutItemDetails";
import PaymentAddressCard from "@/components/PaymentAddressCard/PaymentAddressCard";
import PickupDeadlineWarning from "@/components/PickupDeadlineWarning/PickupDeadlineWarning";

interface ProductPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  professionalId: number;
  professionalProductId?: string;
  sellerName?: string;
  sellerProvince?: string;
  companyFreeShippingCountry?: boolean;
  companyFreeShippingCountryMinAmount?: number;
  isAgeRestricted?: boolean;
  canPurchase?: boolean;
  pageMode?: boolean;
  initialQuantity?: number;
}

export default function ProductPaymentModal({
  isOpen,
  onClose,
  product,
  professionalId,
  professionalProductId,
  sellerName,
  companyFreeShippingCountry = false,
  companyFreeShippingCountryMinAmount = 0,
  isAgeRestricted = false,
  canPurchase = true,
  pageMode = false,
  initialQuantity = 1,
}: ProductPaymentModalProps) {
  const router = useRouter();
  const { data: cardConfig } = useCardPaymentConfig();
  const { user, isAgeVerified } = useAuth();
  const { showSuccess, showError } = useAlert();
  const availableStock = Math.max(
    0,
    Math.trunc(Number(product?.stock ?? 0) || 0),
  );

  // Step and flow states
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [billingAddressId, setBillingAddressId] = useState("");
  const [billingAddressComplete, setBillingAddressComplete] = useState(false);
  const [scheduleForNextDay, setScheduleForNextDay] = useState(false);

  const { data: userAddresses = [] } = useQuery<UserAddress[]>({
    queryKey: ["user-addresses", user?.id],
    queryFn: () => commerceService.getUserAddresses(),
    enabled: isOpen && Boolean(user),
  });
  useEffect(() => {
    setScheduleForNextDay(false);
  }, [selectedBranchId, deliveryType]);
  useEffect(() => {
    const available = userAddresses.filter(
      (address) => address.latitude != null && address.longitude != null,
    );
    if (!available.some((address) => address.id === selectedAddressId)) {
      setSelectedAddressId(
        (available.find((address) => address.is_default) || available[0])?.id ||
          "",
      );
    }
  }, [selectedAddressId, userAddresses]);
  const selectedAddress = userAddresses.find(
    (address) => address.id === selectedAddressId,
  );
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: [
      "professional-locations",
      professionalId,
      selectedAddress?.province_id,
      selectedAddress?.department_id,
    ],
    queryFn: () =>
      commerceService.professionalLocations(
        professionalId,
        selectedAddress?.province_id,
        selectedAddress?.department_id,
      ),
    enabled: isOpen && Boolean(professionalId),
  });
  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchId,
  );
  const shippingBranches = useMemo(
    () =>
      branches.filter(
        (branch) =>
          branch.delivery_available === true &&
          (branch.is_open !== false || branch.own_riders_available === true) &&
          getDeliveryCoverage(branch, selectedAddress).status !== "outside",
      ),
    [branches, selectedAddress],
  );
  const hasShippingBranch = shippingBranches.length > 0;
  useEffect(() => {
    const current = branches.find((branch) => branch.id === selectedBranchId);
    const canUse = (branch: Branch) =>
      deliveryType === "pickup"
        ? branch.is_pickup_point
        : shippingBranches.includes(branch);
    if ((!current || !canUse(current)) && branches.length) {
      const available = branches.find(canUse);
      setSelectedBranchId(available?.id || "");
    }
  }, [branches, selectedBranchId, deliveryType, shippingBranches]);
  const deliveryCoverage = getDeliveryCoverage(selectedBranch, selectedAddress);
  const isOutsideDeliveryRange = deliveryCoverage.status === "outside";
  const hasPickupBranch = branches.some((branch) => branch.is_pickup_point);
  useEffect(() => {
    if (deliveryType === "shipment" && !hasShippingBranch) {
      setDeliveryType(hasPickupBranch ? "pickup" : "coordinate_with_merchant");
    }
  }, [deliveryType, hasShippingBranch, hasPickupBranch]);
  const originSelection = selectedBranch?.is_main
    ? { origin_address_id: selectedBranch.address_id ?? undefined }
    : { branch_id: selectedBranchId || undefined };

  // Automated shipping calculation states
  const [shippingCalc, setShippingCalc] =
    useState<CalculateShippingResponse | null>(null);
  const [quotedFor, setQuotedFor] = useState("");
  const shippingQuoteKey = JSON.stringify({
    professionalProductId,
    quantity,
    selectedAddressId,
    selectedBranchId,
  });
  const [isCalculatingShipping, setIsCalculatingShipping] =
    useState<boolean>(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paycloud_qr">(
    "card",
  );
  const [installments, setInstallments] = useState<number>(1);

  // Saved payment methods
  const { data: commissions = [] } = useQuery<MarketplaceCommission[]>({
    queryKey: ["marketplace-commissions"],
    queryFn: async () => {
      const res = await commerceService.commissions();
      return Array.isArray(res) ? res : [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const { data: savedCards = [] } = useQuery<UserPaymentMethod[]>({
    queryKey: ["user-payment-methods"],
    queryFn: async () => {
      return await commerceService.getUserPaymentMethods();
    },
    enabled: isOpen,
    select: (cards: UserPaymentMethod[]) =>
      cards.filter(
        (card) => (card.provider || "getnet") === cardConfig?.provider,
      ),
  });

  const [useSavedCard, setUseSavedCard] = useState<boolean>(true);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string>("");
  const [saveCardForFuture, setSaveCardForFuture] = useState<boolean>(false);
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
  const submittingRef = useRef(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [activeQr, setActiveQr] = useState<PayCloudQrResponse | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(900);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setActiveQr(null);
      setQuantity(Math.max(1, Math.min(initialQuantity, availableStock)));
    }
  }, [isOpen, initialQuantity, availableStock]);

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
    if (
      !isOpen ||
      deliveryType === "coordinate_with_merchant" ||
      !professionalProductId ||
      !selectedAddressId ||
      !selectedBranchId ||
      isOutsideDeliveryRange
    ) {
      setShippingCalc(null);
      setQuotedFor("");
      setIsCalculatingShipping(false);
      return;
    }

    let isMounted = true;
    setIsCalculatingShipping(true);
    setShippingCalc(null);
    setQuotedFor("");

    const timer = setTimeout(async () => {
      try {
        const res = await commerceService.calculateShipping({
          professional_product_id: professionalProductId,
          quantity,
          delivery_type: "shipment",
          delivery_address_id: selectedAddressId,
          ...(selectedBranch?.is_main
            ? { origin_address_id: selectedBranch.address_id ?? undefined }
            : { branch_id: selectedBranchId }),
        });

        if (isMounted) {
          setShippingCalc(res);
          setQuotedFor(shippingQuoteKey);
        }
      } catch (err) {
        if (isMounted) setShippingCalc(null);
        console.warn("Shipping calculation error:", err);
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
    quantity,
    selectedAddressId,
    selectedBranchId,
    selectedBranch?.is_main,
    selectedBranch?.address_id,
    isOutsideDeliveryRange,
    shippingQuoteKey,
  ]);

  if (!isOpen) return null;

  const firstImage =
    product?.Images?.[0] ?? product?.images?.[0] ?? product?.image_url;
  const productImage =
    typeof firstImage === "string"
      ? firstImage
      : (firstImage?.image_url ?? firstImage?.url);

  // Active pricing calculation
  const pricing = calculateProductPricing(product, quantity);
  const activeUnitPrice = pricing.unitPrice;

  // Active installments conditions
  const installmentsEnabled = Boolean(product?.installments_enabled);
  const installmentsRestricted = Boolean(
    product?.is_food_perishable ||
    product?.category?.no_installments ||
    product?.category?.is_food ||
    product?.subCategory?.no_installments ||
    product?.subCategory?.is_food,
  );

  const maxInstallments = Number(product?.max_installments || 12);

  const subtotal = pricing.subtotal;
  const isOutsideProvince =
    selectedBranch?.province_id != null &&
    selectedAddress?.province_id != null &&
    Number(selectedBranch.province_id) !== Number(selectedAddress.province_id);
  const hasFreeShippingByParcel =
    Boolean(product?.free_shipping) ||
    (companyFreeShippingCountry &&
      isOutsideProvince &&
      subtotal >= companyFreeShippingCountryMinAmount);

  // Shipping cost from automated calculation
  const currentShippingCalc =
    quotedFor === shippingQuoteKey ? shippingCalc : null;
  const calculatedShippingFee =
    deliveryType === "shipment" && currentShippingCalc
      ? currentShippingCalc.is_free_shipping
        ? 0
        : Number(currentShippingCalc.shippingCost || 0)
      : 0;

  const financingQuote = calculateInstallmentFinancing(
    subtotal,
    installments,
    commissions,
  );
  const financingAmount =
    !installmentsEnabled &&
    paymentMethod === "card" &&
    installments > 1 &&
    financingQuote
      ? financingQuote.totalAmount - subtotal
      : 0;
  const totalToPay = subtotal + financingAmount + calculatedShippingFee;
  const installmentAmount = Number((totalToPay / installments).toFixed(2));

  // Available installment choices
  const possibleCounts = [1, 2, 3, 6, 9, 12, 18];
  const interestFreeChoices = possibleCounts.filter(
    (c) =>
      c <= maxInstallments &&
      (c === 1 ||
        (!installmentsRestricted &&
          commissions.some((rate) => Number(rate.installments) === c))),
  );
  const standardChoices =
    commissions.length > 0
      ? commissions
          .map((c) => c.installments)
          .filter(
            (inst) =>
              [1, 2, 3, 6, 9, 12, 18].includes(inst) &&
              (inst === 1 || !installmentsRestricted) &&
              calculateInstallmentFinancing(subtotal, inst, commissions),
          )
          .sort((a, b) => a - b)
      : [1];

  // Card input formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 19);
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

    if (availableStock === 0 || quantity > availableStock) {
      showError(`Stock insuficiente (disponible: ${availableStock}).`);
      return;
    }

    if (!user) {
      showError("Debes iniciar sesión para completar la compra.");
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    if (!isAgeVerified) {
      requestIdentityVerification();
      return;
    }

    if (isAgeRestricted && !canPurchase) {
      showError(
        "Debes verificar tu mayoría de edad para comprar este producto.",
      );
      return;
    }

    if (deliveryType === "shipment") {
      if (!hasShippingBranch || !selectedBranch?.delivery_available) {
        showError(
          "No hay riders disponibles para delivery en esta zona. Elegí retiro o acordá el envío con el vendedor.",
        );
        return;
      }
      if (isOutsideDeliveryRange) {
        showError(
          "La dirección está fuera del rango de esta sucursal. Elegí retiro o acordá la entrega con el vendedor.",
        );
        return;
      }
      if (!selectedAddressId || !currentShippingCalc) {
        showError(
          "Seleccioná una dirección guardada y esperá el cálculo del envío.",
        );
        return;
      }
      if (
        currentShippingCalc.requires_scheduled_delivery &&
        !scheduleForNextDay
      ) {
        showError("Confirmá el envío programado para mañana.");
        return;
      }
    }
    if (
      deliveryType !== "coordinate_with_merchant" &&
      (!selectedBranch ||
        (deliveryType === "pickup" && !selectedBranch.is_pickup_point) ||
        (deliveryType === "shipment" &&
          selectedBranch.is_open === false &&
          !selectedBranch.own_riders_available))
    ) {
      showError("Seleccioná una sucursal disponible.");
      return;
    }

    const selectedCard = savedCards.find((c) => c.id === selectedSavedCardId);

    if (paymentMethod === "card") {
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

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      let token: string;
      let cardLastFour: string;
      let cardholderName: string;
      let expiration: string;

      if (paymentMethod === "card" && useSavedCard && selectedCard) {
        token = selectedCard.getnet_card_token || "";
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

      let paywayData = {};
      let refreshPayment: (() => ReturnType<typeof tokenizePayway>) | undefined;
      let providerMethod: "getnet_card" | "payway_card" = "getnet_card";
      if (paymentMethod === "card") {
        const config = await getCardConfig();
        if (config.provider === "payway") {
          if (!billingAddressId || !billingAddressComplete)
            throw new Error(
              "Seleccioná o completá la dirección del comprador antes de pagar.",
            );
          refreshPayment = () =>
            tokenizePayway(
              config,
              {
                number: cardNumber,
                holder: cardHolder.trim(),
                dni: cardDni.trim(),
                expiry: cardExpiry,
                cvv: cardCvv,
                type: cardType,
              },
              useSavedCard ? selectedCard : undefined,
            );
          const prepared = await refreshPayment();
          token = prepared.card_token;
          paywayData = prepared;
          providerMethod = "payway_card";
        } else if (
          selectedCard &&
          (selectedCard.provider || "getnet") !== "getnet"
        ) {
          throw new Error("Cambió el proveedor. Actualizá las tarjetas.");
        } else if (!useSavedCard || !selectedCard) {
          await validateCardholder(cardHolder, cardDni);
        }
      }
      const res = await commerceService.checkout(
        {
          ...paywayData,
          save_card:
            providerMethod === "payway_card" &&
            saveCardForFuture &&
            !useSavedCard,
          professional_id: professionalId,
          professional_product_id: professionalProductId,
          quantity: quantity,
          expected_total_amount: totalToPay,
          delivery_type: deliveryType,
          billing_address_id:
            providerMethod === "payway_card" ? billingAddressId : undefined,
          ...(deliveryType !== "coordinate_with_merchant"
            ? originSelection
            : {}),
          delivery_address_id:
            deliveryType === "shipment" ||
            deliveryType === "coordinate_with_merchant"
              ? selectedAddressId || undefined
              : undefined,
          schedule_for_next_day:
            deliveryType === "shipment" &&
            currentShippingCalc?.requires_scheduled_delivery
              ? scheduleForNextDay
              : undefined,
          payment_method:
            paymentMethod === "card" ? providerMethod : "paycloud_qr",
          ...(providerMethod === "getnet_card" && paymentMethod === "card"
            ? {
                saved_payment_method_id:
                  useSavedCard && selectedCard ? selectedCard.id : undefined,
                card_holder_name:
                  useSavedCard && selectedCard ? undefined : cardHolder.trim(),
                card_holder_dni:
                  useSavedCard && selectedCard ? undefined : cardDni.trim(),
              }
            : {}),
          card_token: paymentMethod === "card" ? token : undefined,
          installments: paymentMethod === "card" ? installments : 1,
          card_details:
            paymentMethod === "card" && providerMethod === "getnet_card"
              ? {
                  card_number: cardLastFour,
                  cardholder_name: cardholderName,
                  expiration: expiration,
                  cvv: cardCvv,
                  dni: cardDni.trim() || "0",
                }
              : undefined,
        },
        { refreshPayment },
      );

      if (paymentMethod === "paycloud_qr" && res.qr) {
        setActiveQr(res.qr);
        setQrSecondsLeft(900);
      } else {
        // Si pagó con tarjeta nueva y marcó guardar tarjeta
        if (
          paymentMethod === "card" &&
          !useSavedCard &&
          saveCardForFuture &&
          providerMethod === "getnet_card" &&
          process.env.NODE_ENV === "development"
        ) {
          const [mmStr, yyStr] = cardExpiry.split("/");
          commerceService
            .createUserPaymentMethod({
              getnet_card_token: token,
              last_four: cardLastFour,
              card_brand: cardBrand || "tarjeta",
              card_type: cardType,
              card_holder_name: cardholderName,
              card_holder_dni: cardDni.trim(),
              expiry_month: parseInt(mmStr, 10) || 12,
              expiry_year: 2000 + (parseInt(yyStr, 10) || 28),
              is_default: savedCards.length === 0,
            })
            .catch((e) => console.error("Error guardando tarjeta:", e));
        }

        setCompletedOrder({
          ...res.order,
          card_saved: res.card_saved,
          save_requested:
            providerMethod === "payway_card" &&
            saveCardForFuture &&
            !useSavedCard,
        });
        showSuccess(
          res.payment_status === "approved"
            ? "¡Pago procesado con éxito!"
            : "Estamos verificando tu pago. Consultá Mis Compras sin volver a pagar.",
        );
      }
    } catch (err: any) {
      showError(
        err?.message || "No se pudo procesar el pago. Intenta nuevamente.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const content = (
    <div
      className={`product-payment-modal${pageMode ? " product-payment-modal--page" : ""}`}
    >
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
                alt="QR de Pago"
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
          {deliveryType === "pickup" && <PickupDeadlineWarning />}

          <div className="product-payment-modal__qr-actions">
            <button
              type="button"
              className="btn-primary product-payment-modal__btn-full"
              onClick={() => {
                if (!pageMode) onClose();
                router.push("/panel?view=purchases");
              }}
            >
              <CheckCircle2 size={18} />
              <span>Ya realicé el pago</span>
            </button>
          </div>
          <ReturnsPolicyLink />
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
            {completedOrder.status === "paid"
              ? "¡Pago confirmado!"
              : "Pago pendiente de confirmación"}
          </h3>
          <p className="product-payment-modal__success-desc">
            {completedOrder.status === "paid"
              ? "Tu compra fue confirmada y el vendedor ha sido notificado."
              : "Consultá el estado desde Mis Compras. Evitá volver a pagar mientras se confirma el cobro."}
          </p>
          {deliveryType === "pickup" && <PickupDeadlineWarning />}

          <div className="product-payment-modal__success-card">
            {completedOrder.status === "paid" &&
              completedOrder.save_requested &&
              !completedOrder.card_saved && (
                <p>
                  El pago fue confirmado, pero no se pudo guardar la tarjeta.
                  Podés volver a consultar el pago desde Mis Compras.
                </p>
              )}
            <div className="product-payment-modal__summary-row">
              <span>Producto:</span>
              <strong>{product?.name}</strong>
            </div>
            <div className="product-payment-modal__summary-row">
              <span>Cantidad:</span>
              <strong>{quantity} unidad(es)</strong>
            </div>
            <div className="product-payment-modal__summary-row">
              <span>Total del pedido:</span>
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
              if (!pageMode) onClose();
              router.push("/panel?view=purchases");
            }}
          >
            <span>Ver en Mis Compras</span>
            <ArrowRight size={18} />
          </button>
          <ReturnsPolicyLink />
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
                verificar tu edad en tu cuenta para poder comprar este producto.
              </span>
            </div>
          )}

          <div className="product-payment-modal__checkout-grid">
            <div className="product-payment-modal__checkout-main">
              <h2 className="product-payment-modal__panel-title">Tu pedido</h2>

              {/* Product Summary Header */}
              <div className="product-payment-modal__product-header">
                {productImage && (
                  <Image
                    src={productImage}
                    alt={product?.name || "Producto"}
                    width={96}
                    height={96}
                    className="product-payment-modal__product-image"
                    unoptimized
                  />
                )}
                <div className="product-payment-modal__product-info">
                  <span className="product-payment-modal__product-name">
                    {product?.name}
                  </span>
                  <CheckoutItemDetails product={product} />
                  <span className="product-payment-modal__seller-tag">
                    Vendedor: {sellerName || "Comercio verificado"}
                  </span>
                </div>
                <div className="product-payment-modal__unit-price">
                  ${activeUnitPrice.toLocaleString("es-AR")}
                </div>
              </div>

              {/* Quantity */}
              <div className="product-payment-modal__section">
                <label className="product-payment-modal__label">Cantidad</label>
                {availableStock > 0 && (
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
                      onClick={() =>
                        setQuantity((q) => Math.min(availableStock, q + 1))
                      }
                      disabled={quantity >= availableStock}
                    >
                      +
                    </button>
                  </div>
                )}
                <span className="product-payment-modal__stock-note">
                  {availableStock > 0
                    ? `${availableStock} disponible${availableStock === 1 ? "" : "s"}`
                    : "Sin stock"}
                </span>
              </div>

              {/* Delivery Method */}
              <div className="product-payment-modal__section">
                <label className="product-payment-modal__label">
                  Forma de entrega
                </label>
                <div className="product-payment-modal__delivery-options">
                  <button
                    type="button"
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
                      <p>Gratis</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!hasShippingBranch}
                    className={`product-payment-modal__delivery-card ${
                      deliveryType === "shipment"
                        ? "product-payment-modal__delivery-card--active"
                        : ""
                    }`}
                    onClick={() => {
                      if (hasShippingBranch) setDeliveryType("shipment");
                    }}
                  >
                    <Truck size={18} />
                    <div>
                      <strong>Envío a domicilio</strong>
                      <p>
                        {!branches.some((branch) => branch.delivery_available)
                          ? "No hay riders autónomos disponibles en esta zona"
                          : isOutsideDeliveryRange
                            ? "Fuera del rango de la sucursal seleccionada"
                            : "Recibí en tu dirección"}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
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
                      <p>
                        {hasFreeShippingByParcel
                          ? "Encomienda gratis; acordá el envío con el vendedor"
                          : "Coordinar entrega directa"}
                      </p>
                    </div>
                  </button>
                </div>

                {isOutsideDeliveryRange && (
                  <p
                    className="product-payment-modal__coverage-notice"
                    role="status"
                  >
                    {deliveryCoverage.distanceKm != null &&
                    deliveryCoverage.radiusKm != null
                      ? `Tu dirección está a ${deliveryCoverage.distanceKm} km y esta sucursal entrega hasta ${deliveryCoverage.radiusKm} km. `
                      : "Esta sucursal no tiene un rango de entrega configurado. "}
                    Elegí retiro en tienda o acordá la entrega con el vendedor.
                    {hasFreeShippingByParcel &&
                      " Si acordás una encomienda, el envío es gratis."}
                  </p>
                )}

                {deliveryType !== "coordinate_with_merchant" && (
                  <div className="product-payment-modal__address-fields">
                    <label className="product-payment-modal__input-label">
                      {deliveryType === "pickup"
                        ? "Sucursal de retiro"
                        : "Sucursal de origen"}
                    </label>
                    <select
                      className="product-payment-modal__select"
                      value={selectedBranchId}
                      onChange={(event) =>
                        setSelectedBranchId(event.target.value)
                      }
                    >
                      <option value="">Seleccionar sucursal</option>
                      {branches
                        .filter((branch) =>
                          deliveryType === "pickup"
                            ? branch.is_pickup_point
                            : shippingBranches.includes(branch),
                        )
                        .map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name} — {branch.street_name}{" "}
                            {branch.street_number}
                            {branch.delivery_eta_minutes
                              ? ` · Demora ${branch.delivery_eta_minutes} min`
                              : ""}
                            {deliveryType === "shipment" &&
                            branch.is_open === false
                              ? " · Envío mañana"
                              : ""}
                          </option>
                        ))}
                    </select>
                    {selectedBranch?.delivery_eta_minutes != null && (
                      <p>
                        Demora estimada{" "}
                        {selectedBranch.is_open === false &&
                        deliveryType === "shipment"
                          ? "desde el despacho de mañana"
                          : "de esta sucursal"}
                        : {selectedBranch.delivery_eta_minutes} minutos.
                      </p>
                    )}
                    {deliveryType === "pickup" &&
                      selectedBranch?.is_open === false && (
                        <p>
                          Podés comprar ahora y retirar tu pedido cuando te
                          convenga.
                        </p>
                      )}
                  </div>
                )}

                {deliveryType === "pickup" && <PickupDeadlineWarning />}

                {/* Dirección guardada para envío */}
                {(deliveryType === "shipment" ||
                  deliveryType === "coordinate_with_merchant" ||
                  isOutsideDeliveryRange) && (
                  <div className="product-payment-modal__address-fields">
                    <label className="product-payment-modal__input-label">
                      {deliveryType === "coordinate_with_merchant"
                        ? "Dirección del destinatario"
                        : isOutsideDeliveryRange
                          ? "Cambiar dirección para comprobar cobertura"
                          : "Dirección de entrega"}
                    </label>
                    <select
                      className="product-payment-modal__select"
                      value={selectedAddressId}
                      onChange={(event) =>
                        setSelectedAddressId(event.target.value)
                      }
                    >
                      <option value="">Seleccionar dirección guardada</option>
                      {userAddresses
                        .filter(
                          (address) =>
                            deliveryType === "coordinate_with_merchant" ||
                            (address.latitude != null &&
                              address.longitude != null),
                        )
                        .map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.name ||
                              address.street_name ||
                              address.street}{" "}
                            {address.street_number || address.number}
                          </option>
                        ))}
                    </select>
                    {deliveryType === "shipment" &&
                      !userAddresses.some(
                        (address) =>
                          address.latitude != null && address.longitude != null,
                      ) && (
                        <p>
                          Guardá una dirección con ubicación en el mapa para
                          pedir el envío.
                        </p>
                      )}

                    {/* Automated Shipping Calculation & Vehicle Box */}
                    {deliveryType === "shipment" && (
                      <div className="product-payment-modal__shipping-calc-box">
                        {isCalculatingShipping ? (
                          <div className="product-payment-modal__shipping-calc-loading">
                            <Loader2 size={16} className="animate-spin" />
                            <span>
                              Calculando costo y logística de envío...
                            </span>
                          </div>
                        ) : currentShippingCalc ? (
                          <div className="product-payment-modal__shipping-calc-content">
                            <div className="product-payment-modal__shipping-calc-header">
                              <div className="product-payment-modal__shipping-calc-meta">
                                <span className="product-payment-modal__vehicle-badge">
                                  <Truck size={14} />
                                  {currentShippingCalc.vehicle?.name ||
                                    "Rider / Repartidor"}
                                </span>
                                {currentShippingCalc.is_night && (
                                  <span className="product-payment-modal__night-badge">
                                    Tarifa Nocturna
                                  </span>
                                )}
                                {currentShippingCalc.requires_heavy_vehicle && (
                                  <span className="product-payment-modal__heavy-badge">
                                    Carga Pesada
                                  </span>
                                )}
                              </div>
                              <div className="product-payment-modal__shipping-calc-price">
                                {currentShippingCalc.is_free_shipping ? (
                                  <span className="product-payment-modal__free-shipping-text">
                                    ¡Envío Gratis!
                                  </span>
                                ) : (
                                  <span>
                                    $
                                    {Number(
                                      currentShippingCalc.shippingCost,
                                    ).toLocaleString("es-AR")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="product-payment-modal__shipping-calc-details">
                              <span>
                                Distancia estimada:{" "}
                                <strong>
                                  {currentShippingCalc.distance_km} km
                                </strong>
                              </span>
                              <span>•</span>
                              <span>
                                Peso aprox:{" "}
                                <strong>
                                  {currentShippingCalc.total_weight_kg} kg
                                </strong>
                              </span>
                              {currentShippingCalc.is_free_shipping &&
                                currentShippingCalc.free_shipping_reason && (
                                  <p className="product-payment-modal__free-reason">
                                    {currentShippingCalc.free_shipping_reason}
                                  </p>
                                )}
                            </div>
                          </div>
                        ) : (
                          <div className="product-payment-modal__shipping-calc-info">
                            <MapPin size={16} />
                            <span>
                              Tarifa mínima de partida: $1.500 (primer km). El
                              costo final se calcula según distancia y peso del
                              paquete.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {deliveryType === "shipment" &&
                      currentShippingCalc?.requires_scheduled_delivery && (
                        <label className="product-payment-modal__schedule-option">
                          <input
                            type="checkbox"
                            checked={scheduleForNextDay}
                            onChange={(event) =>
                              setScheduleForNextDay(event.target.checked)
                            }
                          />
                          <span>
                            El comercio está cerrado. Programar el envío con sus
                            riders para mañana
                            {currentShippingCalc.scheduled_delivery_date
                              ? ` (${currentShippingCalc.scheduled_delivery_date.split("-").reverse().join("/")})`
                              : ""}
                            .
                          </span>
                        </label>
                      )}
                  </div>
                )}
              </div>
            </div>
            <div className="product-payment-modal__checkout-payment">
              <h2 className="product-payment-modal__panel-title">Pago</h2>
              {user &&
                paymentMethod === "card" &&
                cardConfig?.provider === "payway" && (
                  <PaymentAddressCard
                    preferredId={selectedAddressId}
                    onChange={(id, complete) => {
                      setBillingAddressId(id);
                      setBillingAddressComplete(complete);
                    }}
                  />
                )}

              {/* Payment Method Selector */}
              <div className="product-payment-modal__section">
                <label className="product-payment-modal__label">
                  Medio de Pago
                </label>
                <div className="product-payment-modal__payment-tabs">
                  <button
                    type="button"
                    className={`product-payment-modal__payment-tab ${
                      paymentMethod === "card"
                        ? "product-payment-modal__payment-tab--active"
                        : ""
                    }`}
                    onClick={() => {
                      setPaymentMethod("card");
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
                    <span>QR Interoperable</span>
                  </button>
                </div>

                {/* Getnet Card Form & Installments */}
                {paymentMethod === "card" ? (
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
                              const quote = calculateInstallmentFinancing(
                                subtotal,
                                c,
                                commissions,
                              )!;
                              const surchargePct = quote.surchargePct;
                              const totalW = quote.totalAmount;
                              const instPrice = quote.installmentAmount;
                              return (
                                <option key={c} value={c}>
                                  {c === 1
                                    ? `1 cuota de $${subtotal.toLocaleString("es-AR")} (sin recargo)`
                                    : `${c} cuotas fijas de $${instPrice.toLocaleString("es-AR")} (+${surchargePct.toFixed(2)}% | Total: $${totalW.toLocaleString("es-AR")})`}
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
                          onChange={(e) =>
                            setSelectedSavedCardId(e.target.value)
                          }
                        >
                          {savedCards.map((sc) => {
                            const brand = (
                              sc.card_brand || "Tarjeta"
                            ).toUpperCase();
                            const bank = sc.bank_name || "Banco";
                            const type =
                              sc.card_type === "debit" ? "Débito" : "Crédito";
                            const def = sc.is_default
                              ? " ★ Predeterminada"
                              : "";
                            return (
                              <option key={sc.id} value={sc.id}>
                                {bank} •••• {sc.last_four} ({brand} {type}) -{" "}
                                {sc.card_holder_name || "Titular"}
                                {def}
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
                              Tipo
                            </label>
                            <select
                              className="product-payment-modal__select"
                              value={cardType}
                              onChange={(e) => {
                                setCardType(
                                  e.target.value as "credit" | "debit",
                                );
                                if (e.target.value === "debit")
                                  setInstallments(1);
                              }}
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
                        {process.env.NODE_ENV === "development" && (
                          <label className="product-payment-modal__save-card-label">
                            <input
                              type="checkbox"
                              checked={saveCardForFuture}
                              onChange={(e) =>
                                setSaveCardForFuture(e.target.checked)
                              }
                            />
                            Guardar tarjeta de prueba para compras futuras
                          </label>
                        )}
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
                      <strong>
                        Pago en 1 cuota con Código QR interoperable
                      </strong>
                      <p>
                        Al presionar continuar, se generará tu código QR
                        dinámico. Podrás escanearlo con Mercado Pago, MODO,
                        Cuenta DNI, BNA+, Ualá y cualquier billetera bancaria de
                        Argentina.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Total summary */}
              <div className="product-payment-modal__total-block">
                {deliveryType === "pickup" && <PickupDeadlineWarning />}
                <div className="product-payment-modal__summary-row">
                  <span>Subtotal ({quantity} un.):</span>
                  <span>${subtotal.toLocaleString("es-AR")}</span>
                </div>
                {pricing.promotion && (
                  <div className="product-payment-modal__summary-row">
                    <span>
                      Promoción {pricing.promotion}: pagás {pricing.paidUnits}{" "}
                      de {quantity}
                    </span>
                  </div>
                )}
                {pricing.wholesaleApplied && (
                  <div className="product-payment-modal__summary-row">
                    <span>
                      Precio mayorista aplicado desde {pricing.wholesaleMinimum}{" "}
                      unidades
                    </span>
                  </div>
                )}
                {deliveryType === "shipment" && (
                  <div className="product-payment-modal__summary-row">
                    <span>Costo de Envío:</span>
                    <span>
                      {calculatedShippingFee === 0 &&
                      currentShippingCalc?.is_free_shipping
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
                {deliveryType !== "coordinate_with_merchant" &&
                  currentShippingCalc?.is_free_shipping && (
                    <div className="product-payment-modal__summary-row product-payment-modal__summary-row--free-delivery">
                      Envío gratis a domicilio
                    </div>
                  )}
                {deliveryType === "coordinate_with_merchant" &&
                  hasFreeShippingByParcel && (
                    <div className="product-payment-modal__summary-row product-payment-modal__summary-row--free-delivery">
                      Envío gratis a convenir con el comercio
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
              <ReturnsPolicyLink />
              <div className="product-payment-modal__actions">
                <button
                  data-action-tone="cancel"
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
                  disabled={
                    isSubmitting ||
                    availableStock === 0 ||
                    quantity > availableStock ||
                    (isAgeRestricted && !canPurchase) ||
                    (paymentMethod === "card" &&
                      installments > 1 &&
                      !installmentsEnabled &&
                      !financingQuote) ||
                    (paymentMethod === "card" &&
                      cardConfig?.provider === "payway" &&
                      !billingAddressComplete)
                  }
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
                <div className="product-payment-modal__security-row">
                  <ShieldCheck size={16} />
                  <span>Transacción cifrada y protegida</span>
                </div>
                <span className="product-payment-modal__security-subtext">
                  Compra Protegida o te devolvemos el dinero
                </span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
  return pageMode ? (
    content
  ) : (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Compra">
      {content}
    </Modal>
  );
}
