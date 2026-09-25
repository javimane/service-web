"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store,
  Truck,
  MapPin,
  Clock,
  CreditCard,
  QrCode,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  commerceService,
  Cart,
  CartItem,
  DeliveryType,
  Branch,
  UserAddress,
  UserPaymentMethod,
  PayCloudQrResponse,
  CalculateShippingResponse,
} from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import Modal from "@/components/Modal/Modal";
import ReturnsPolicyLink from "@/components/ReturnsPolicyLink/ReturnsPolicyLink";
import { ROUTES } from "@/routes/paths";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import {
  clearGuestCart,
  getGuestCart,
  removeGuestCartItem,
  updateGuestCartItem,
} from "@/utils/guestCart";
import "./CartSection.css";

export default function CartSection() {
  const token = getAccessToken();
  setApiAccessToken(token);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: isAuthLoading } = useAuth();
  const { openAuth } = useAuthModal();
  const { showSuccess, showError } = useAlert();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [shippingQuote, setShippingQuote] = useState<CalculateShippingResponse | null>(null);
  const [scheduleForNextDay, setScheduleForNextDay] = useState(false);
  const [quotedFor, setQuotedFor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"getnet" | "paycloud_qr">("paycloud_qr");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [installments, setInstallments] = useState(1);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrData, setActiveQrData] = useState<PayCloudQrResponse | null>(null);
  const [qrTimerSeconds, setQrTimerSeconds] = useState(900); // 15 min
  const isMigratingGuestCart = useRef(false);

  const {
    data: cart,
    isLoading: isCartLoading,
    isError,
    refetch: refetchCart,
  } = useQuery<Cart>({
    queryKey: ["user-cart", user?.id ?? "guest"],
    queryFn: () => (user ? commerceService.cart() : getGuestCart()),
    enabled: !isAuthLoading,
  });

  const items = cart?.items ?? [];
  const merchantId = cart?.professional_id;
  const hasService = items.some((item) =>
    Boolean(item.service_id || item.service),
  );
  const activeDeliveryType: DeliveryType = hasService
    ? "coordinate_with_merchant"
    : deliveryType;

  // Fetch branches for merchant if pickup selected
  const { data: rawBranches } = useQuery({
    queryKey: ["merchant-branches", merchantId],
    queryFn: () => commerceService.professionalLocations(merchantId!),
    enabled: Boolean(merchantId) && !hasService,
  });

  const branches = useMemo<Branch[]>(() => {
    if (Array.isArray(rawBranches)) return rawBranches;
    if (Array.isArray((rawBranches as any)?.data)) {
      return (rawBranches as any).data;
    }
    if (Array.isArray((rawBranches as any)?.items)) {
      return (rawBranches as any).items;
    }
    return [];
  }, [rawBranches]);

  const { data: userAddresses = [] } = useQuery<UserAddress[]>({
    queryKey: ["user-addresses", user?.id],
    queryFn: () => commerceService.getUserAddresses(),
    enabled: Boolean(user),
  });
  const { data: savedCards = [] } = useQuery<UserPaymentMethod[]>({
    queryKey: ["user-payment-methods", user?.id],
    queryFn: () => commerceService.getUserPaymentMethods(),
    enabled: Boolean(user),
  });
  useEffect(() => {
    if (!selectedCardId && savedCards.length) {
      setSelectedCardId((savedCards.find((card) => card.is_default) || savedCards[0]).id);
    }
  }, [selectedCardId, savedCards]);

  useEffect(() => {
    const available = userAddresses.filter((address) => address.latitude != null && address.longitude != null);
    if (!available.some((address) => address.id === selectedAddressId)) {
      setSelectedAddressId((available.find((address) => address.is_default) || available[0])?.id || "");
    }
  }, [selectedAddressId, userAddresses]);

  useEffect(() => {
    if (!user?.id || isMigratingGuestCart.current) return;

    const guestCart = getGuestCart();
    if (guestCart.items.length === 0) return;

    isMigratingGuestCart.current = true;

    const migrateGuestCart = async () => {
      try {
        let updatedCart: Cart | null = null;

        for (const item of guestCart.items) {
          const productReference = {
            product_id: item.product_id || undefined,
            professional_product_id: item.professional_product_id || undefined,
          };

          updatedCart = await commerceService.addCartItem({
            ...productReference,
            service_id: item.service_id || undefined,
            quantity: item.quantity,
          });
        }

        clearGuestCart();
        if (updatedCart) {
          queryClient.setQueryData(["user-cart", user.id], updatedCart);
        } else {
          await queryClient.invalidateQueries({
            queryKey: ["user-cart", user.id],
          });
        }
      } catch {
        showError(
          "Iniciaste sesión, pero no pudimos transferir tu carrito. Intentá nuevamente.",
        );
      } finally {
        isMigratingGuestCart.current = false;
      }
    };

    void migrateGuestCart();
  }, [queryClient, showError, user?.id]);

  useEffect(() => {
    const current = branches.find((branch) => branch.id === selectedBranchId);
    const canUse = (branch: Branch) => deliveryType === "pickup"
      ? branch.is_pickup_point
      : branch.is_open !== false || branch.own_riders_available;
    if ((!current || !canUse(current)) && branches.length) {
      const available = branches.find(canUse);
      setSelectedBranchId(available?.id || "");
    }
  }, [branches, selectedBranchId, deliveryType]);
  useEffect(() => { setScheduleForNextDay(false); }, [selectedBranchId, deliveryType]);

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);
  const originSelection = selectedBranch?.is_main
    ? { origin_address_id: selectedBranch.address_id ?? undefined }
    : { branch_id: selectedBranchId || undefined };
  const quoteKey = JSON.stringify({
    items: items.map((item) => [item.id, item.quantity]),
    selectedAddressId,
    selectedBranchId,
  });

  // Mutations
  const updateQtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      user
        ? commerceService.updateCartItem(id, qty)
        : Promise.resolve(updateGuestCartItem(id, qty)),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(
        ["user-cart", user?.id ?? "guest"],
        updatedCart,
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      user
        ? commerceService.removeCartItem(id)
        : Promise.resolve(removeGuestCartItem(id)),
    onSuccess: (updatedCart) => {
      showSuccess("Artículo eliminado del carrito.");
      queryClient.setQueryData(
        ["user-cart", user?.id ?? "guest"],
        updatedCart,
      );
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () =>
      user ? commerceService.clearCart() : Promise.resolve(clearGuestCart()),
    onSuccess: (updatedCart) => {
      showSuccess("Carrito vaciado.");
      queryClient.setQueryData(
        ["user-cart", user?.id ?? "guest"],
        updatedCart,
      );
    },
  });

  const calculateShippingMutation = useMutation({
    mutationFn: () => {
      const products = items.filter((item) => item.professional_product_id);
      if (!products.length || !selectedAddressId || !selectedBranch) {
        throw new Error("Seleccioná una sucursal y una dirección de entrega.");
      }
      return commerceService.calculateShipping({
        items: products.map((item) => ({
          professional_product_id: item.professional_product_id!,
          quantity: item.quantity,
        })),
        delivery_type: "shipment",
        delivery_address_id: selectedAddressId,
        ...originSelection,
      });
    },
    onSuccess: (res) => {
      setShippingCost(res.shippingCost);
      setEstimatedTime(res.delivery_estimate || "");
      setShippingQuote(res);
      setQuotedFor(quoteKey);
      showSuccess("Costo de envío calculado.");
    },
    onError: () => {
      setQuotedFor("");
      setShippingQuote(null);
      showError("No se pudo calcular el envío para esta dirección.");
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      commerceService.checkout({
        professional_id: merchantId!,
        items: items.map((item) => ({
          professional_product_id: item.professional_product_id || undefined,
          service_id: item.service_id || undefined,
          quantity: item.quantity,
        })),
        delivery_type: activeDeliveryType,
        ...(!hasService ? originSelection : {}),
        delivery_address_id: activeDeliveryType === "shipment" ? selectedAddressId : undefined,
        schedule_for_next_day: activeDeliveryType === "shipment" &&
          quotedFor === quoteKey && shippingQuote?.requires_scheduled_delivery
          ? scheduleForNextDay : undefined,
        payment_method: paymentMethod,
        card_token: paymentMethod === "getnet"
          ? savedCards.find((card) => card.id === selectedCardId)?.getnet_card_token
          : undefined,
        installments: paymentMethod === "getnet" ? installments : 1,
      }),
    onSuccess: (res) => {
      if (paymentMethod === "paycloud_qr" && res.qr) {
        setActiveQrData(res.qr);
        setQrTimerSeconds(900);
        setQrModalOpen(true);
      } else {
        showSuccess("¡Pago procesado con éxito!");
        queryClient.invalidateQueries({ queryKey: ["user-cart"] });
        router.push(`${ROUTES.dashboard}?view=purchases`);
      }
    },
    onError: () => showError("No se pudo procesar el pago."),
  });

  // QR Timer countdown
  useEffect(() => {
    if (!qrModalOpen || qrTimerSeconds <= 0) return;
    const interval = setInterval(() => {
      setQrTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [qrModalOpen, qrTimerSeconds]);

  const subtotal = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
  const total =
    subtotal + (activeDeliveryType === "shipment" && quotedFor === quoteKey ? shippingCost : 0);

  const handleCheckout = () => {
    if (!user) {
      openAuth("login");
      return;
    }

    if (!hasService && (!selectedBranch ||
      (activeDeliveryType === "pickup" && !selectedBranch.is_pickup_point) ||
      (activeDeliveryType === "shipment" && selectedBranch.is_open === false && !selectedBranch.own_riders_available))) {
      showError("Seleccioná una sucursal disponible para el retiro o envío.");
      return;
    }
    if (activeDeliveryType === "shipment" && quotedFor !== quoteKey) {
      showError("Calculá el costo de envío con la sucursal y dirección elegidas.");
      return;
    }
    if (activeDeliveryType === "shipment" && shippingQuote?.requires_scheduled_delivery && !scheduleForNextDay) {
      showError("Confirmá el envío programado para mañana.");
      return;
    }
    if (paymentMethod === "getnet" && !savedCards.find((card) => card.id === selectedCardId)?.getnet_card_token) {
      showError("Seleccioná una tarjeta guardada para pagar");
      return;
    }
    checkoutMutation.mutate();
  };

  // Check if any product is perishable or has installment limits
  const hasPerishable = items.some((i) => i.product?.is_food_perishable);
  const maxInstallments = hasPerishable
    ? 1
    : items.length > 0
    ? Math.min(...items.map((i) => i.product?.max_installments || 12))
    : 12;

  return (
    <div className="cart-section">
      <header className="cart-section__header">
        <div>
          <span className="cart-section__subtitle">Paso Final</span>
          <h1 className="cart-section__title">Carrito de Compras</h1>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="cart-clear-btn"
            onClick={() => clearCartMutation.mutate()}
          >
            <Trash2 size={16} />
            <span>Vaciar carrito</span>
          </button>
        )}
      </header>

      {/* Cart Content or States */}
      {isCartLoading ? (
        <div className="cart-state cart-state--loading">
          <Clock className="cart-state__spinner" size={32} />
          <p>Cargando carrito...</p>
        </div>
      ) : isError ? (
        <div className="cart-state cart-state--error">
          <AlertCircle size={32} />
          <p>Error al sincronizar tu carrito.</p>
          <button type="button" className="btn-primary" onClick={() => refetchCart()}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="cart-state cart-state--empty">
          <ShoppingCart size={52} />
          <h3>Tu carrito está vacío</h3>
          <p>Explorá el catálogo de comercios y sumá tus artículos deseados.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => router.push(ROUTES.home)}
          >
            Explorar comercios
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items Column */}
          <div className="cart-items-column">
            {/* Merchant Banner notice */}
            <div className="merchant-group-banner">
              <Store size={18} />
              <span>
                {hasService ? "Contratando a" : "Comprando en"}{" "}
                <strong>Comercio #{merchantId}</strong>.{" "}
                {hasService
                  ? "El profesional se comunicará para acordar los detalles del servicio."
                  : "Cada pedido se procesa individualmente por comercio para asegurar el despacho."}
              </span>
            </div>

            <div className="cart-items-list">
              {items.map((item) => {
                const name = item.product?.name || item.service?.name || "Artículo";
                const img = item.product?.image_url;
                const unitPrice = item.unit_price ?? item.product?.price ?? item.service?.price ?? 0;
                const isServiceItem = Boolean(item.service_id || item.service);

                return (
                  <div key={item.id} className="cart-item-card">
                    <div className="cart-item-card__main">
                      {img ? (
                        <img src={img} alt={name} className="cart-item-thumb" />
                      ) : (
                        <div className="cart-item-no-thumb">
                          <ShoppingCart size={20} />
                        </div>
                      )}

                      <div className="cart-item-info">
                        <h4 className="cart-item-name">{name}</h4>
                        <span className="cart-item-unit-price">
                          ${unitPrice.toLocaleString("es-AR")}
                          {isServiceItem ? " por servicio" : " c/u"}
                        </span>
                      </div>
                    </div>

                    <div className="cart-item-card__actions">
                      {isServiceItem ? (
                        <span className="cart-item-card__service-label">
                          Servicio
                        </span>
                      ) : (
                        <div className="cart-qty-control">
                          <button
                            type="button"
                            className="qty-btn"
                            disabled={
                              item.quantity <= 1 || updateQtyMutation.isPending
                            }
                            onClick={() =>
                              updateQtyMutation.mutate({
                                id: item.id,
                                qty: item.quantity - 1,
                              })
                            }
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            disabled={updateQtyMutation.isPending}
                            onClick={() =>
                              updateQtyMutation.mutate({
                                id: item.id,
                                qty: item.quantity + 1,
                              })
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}

                      <div className="cart-item-subtotal">
                        ${item.subtotal.toLocaleString("es-AR")}
                      </div>

                      <button
                        type="button"
                        className="cart-item-delete"
                        title="Eliminar"
                        onClick={() => removeMutation.mutate(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery Method Selector */}
            <div className="cart-delivery-box">
              <h3 className="cart-box-title">Método de Entrega</h3>
              <div className="delivery-options-grid">
                {!hasService ? (
                  <>
                    <button
                      type="button"
                      className={`delivery-option ${
                        deliveryType === "pickup"
                          ? "delivery-option--active"
                          : ""
                      }`}
                      onClick={() => setDeliveryType("pickup")}
                    >
                      <Store size={20} />
                      <div>
                        <strong>Retiro en sucursal</strong>
                        <p>Gratis • Retiro inmediato al estar listo</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`delivery-option ${
                        deliveryType === "shipment"
                          ? "delivery-option--active"
                          : ""
                      }`}
                      onClick={() => setDeliveryType("shipment")}
                    >
                      <Truck size={20} />
                      <div>
                        <strong>Envío a domicilio</strong>
                        <p>Por rider o transporte asignado</p>
                      </div>
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  className={`delivery-option ${
                    activeDeliveryType === "coordinate_with_merchant"
                      ? "delivery-option--active"
                      : ""
                  } ${hasService ? "delivery-option--service" : ""}`}
                  onClick={() => setDeliveryType("coordinate_with_merchant")}
                >
                  <Clock size={20} />
                  <div>
                    <strong>Acordar con vendedor</strong>
                    <p>
                      {hasService
                        ? "El profesional se comunicará para coordinar el servicio"
                        : "Para coordinar logística particular"}
                    </p>
                  </div>
                </button>
              </div>

              {/* Pickup branch selection */}
              {!hasService && deliveryType === "pickup" && (
                <div className="delivery-details-subbox">
                  <label className="commercial-label">Seleccionar sucursal de retiro:</label>
                  {branches.filter((branch) => branch.is_pickup_point).length === 0 ? (
                    <p className="no-branches-warning">
                      El comercio no tiene sucursales cargadas aún. Se coordinará por mensajería.
                    </p>
                  ) : (
                    <select
                      className="branch-select"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      {branches.filter((branch) => branch.is_pickup_point).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.street_name} {b.street_number} ({b.opening_hours || "Horario comercial"})
                          {b.delivery_eta_minutes ? ` · Demora ${b.delivery_eta_minutes} min` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedBranch?.is_open === false && <p>Podés comprar ahora y retirar el pedido cuando te convenga.</p>}
                </div>
              )}

              {/* Shipping address & calculator */}
              {!hasService && deliveryType === "shipment" && (
                <div className="delivery-details-subbox">
                  <label className="commercial-label">Sucursal de origen</label>
                  <select className="branch-select" value={selectedBranchId}
                    onChange={(event) => setSelectedBranchId(event.target.value)}>
                    {branches.filter((branch) => branch.is_open !== false || branch.own_riders_available).map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}{branch.delivery_eta_minutes ? ` · Demora ${branch.delivery_eta_minutes} min` : ""}
                        {branch.is_open === false ? " · Envío mañana" : ""}
                      </option>
                    ))}
                  </select>
                  {selectedBranch?.delivery_eta_minutes != null &&
                    <p>Demora estimada {selectedBranch.is_open === false ? "desde el despacho de mañana" : "de esta sucursal"}: {selectedBranch.delivery_eta_minutes} minutos.</p>}
                  <label className="commercial-label">Dirección de entrega</label>
                  <select className="branch-select" value={selectedAddressId}
                    onChange={(event) => setSelectedAddressId(event.target.value)}>
                    <option value="">Seleccionar dirección guardada</option>
                    {userAddresses.filter((address) => address.latitude != null && address.longitude != null).map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.name || address.street_name || address.street} {address.street_number || address.number}
                      </option>
                    ))}
                  </select>
                  {!userAddresses.some((address) => address.latitude != null && address.longitude != null) &&
                    <p>Guardá una dirección con ubicación en el mapa para pedir el envío.</p>}
                  <div className="shipping-calc-row">
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={!selectedAddressId || !selectedBranchId || calculateShippingMutation.isPending}
                      onClick={() => calculateShippingMutation.mutate()}
                    >
                      Calcular costo
                    </button>
                  </div>

                  {quotedFor === quoteKey && (
                    <div className="shipping-result-badge">
                      <span>Costo estimado: <strong>${shippingCost.toLocaleString("es-AR")}</strong></span>
                      <span>{shippingQuote?.requires_scheduled_delivery ? "Demora desde el despacho" : "Plazo"}: <strong>{estimatedTime || "A confirmar"}</strong></span>
                      {shippingQuote?.requires_scheduled_delivery &&
                        <span>Entrega programable para mañana ({shippingQuote.scheduled_delivery_date?.split("-").reverse().join("/")}).</span>}
                    </div>
                  )}
                  {quotedFor === quoteKey && shippingQuote?.requires_scheduled_delivery && (
                    <label className="cart-schedule-option">
                      <input type="checkbox" checked={scheduleForNextDay}
                        onChange={(event) => setScheduleForNextDay(event.target.checked)} />
                      <span>El comercio está cerrado. Programar el envío con sus riders para mañana.</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Summary & Payment Column */}
          <div className="cart-summary-column">
            <div className="cart-summary-card">
              <h3 className="cart-box-title">Resumen de la Compra</h3>

              <div className="cart-summary-row">
                <span>{hasService ? "Subtotal servicios:" : "Subtotal productos:"}</span>
                <span>${subtotal.toLocaleString("es-AR")}</span>
              </div>

              <div className="cart-summary-row">
                <span>Envío:</span>
                <span>
                  {activeDeliveryType === "pickup"
                    ? "Gratis"
                    : activeDeliveryType === "coordinate_with_merchant"
                    ? "A convenir"
                    : quotedFor === quoteKey
                    ? `$${shippingCost.toLocaleString("es-AR")}`
                    : "Pendiente de cálculo"}
                </span>
              </div>

              <div className="cart-summary-row cart-summary-row--total">
                <span>Total a pagar:</span>
                <span>${total.toLocaleString("es-AR")}</span>
              </div>

              {/* Payment gateway selection */}
              <div className="cart-payment-methods">
                <label className="commercial-label">Medio de Pago</label>

                <div
                  className={`payment-choice-card ${
                    paymentMethod === "paycloud_qr"
                      ? "payment-choice-card--active"
                      : ""
                  }`}
                  onClick={() => setPaymentMethod("paycloud_qr")}
                >
                  <QrCode size={20} />
                  <div>
                    <strong>QR Interoperable</strong>
                    <p>Pagá con cualquier billetera (Mercado Pago, MODO, etc.)</p>
                  </div>
                </div>

                <div
                  className={`payment-choice-card ${
                    paymentMethod === "getnet"
                      ? "payment-choice-card--active"
                      : ""
                  }`}
                  onClick={() => setPaymentMethod("getnet")}
                >
                  <CreditCard size={20} />
                  <div>
                    <strong>Tarjeta de Crédito / Débito</strong>
                    <p>Hasta 12 cuotas bancarias habilitadas</p>
                  </div>
                </div>
              </div>

              {/* Installments selector for Getnet */}
              {paymentMethod === "getnet" && (
                <div className="installments-box">
                  <label className="commercial-label">Tarjeta guardada</label>
                  <select className="installments-select" value={selectedCardId}
                    onChange={(event) => setSelectedCardId(event.target.value)}>
                    <option value="">Seleccionar tarjeta</option>
                    {savedCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.card_brand} terminada en {card.last_four}
                      </option>
                    ))}
                  </select>
                  {savedCards.length === 0 && <p>Guardá una tarjeta en tu perfil para usar este medio de pago.</p>}
                  <label className="commercial-label">Cuotas Disponibles</label>
                  {hasPerishable ? (
                    <div className="perishable-warning-pill">
                      <AlertTriangle size={14} />
                      <span>
                        Los alimentos y perecederos solo se abonan en 1 pago.
                      </span>
                    </div>
                  ) : (
                    <select
                      className="installments-select"
                      value={installments}
                      onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                    >
                      <option value={1}>1 cuota de ${total.toLocaleString("es-AR")}</option>
                      {maxInstallments >= 3 && (
                        <option value={3}>
                          3 cuotas fijas de ${Math.round(total / 3).toLocaleString("es-AR")}
                        </option>
                      )}
                      {maxInstallments >= 6 && (
                        <option value={6}>
                          6 cuotas fijas de ${Math.round(total / 6).toLocaleString("es-AR")}
                        </option>
                      )}
                      {maxInstallments >= 12 && (
                        <option value={12}>
                          12 cuotas de ${Math.round(total / 12).toLocaleString("es-AR")}
                        </option>
                      )}
                    </select>
                  )}
                </div>
              )}

              <ReturnsPolicyLink />
              <button
                type="button"
                className="btn-primary cart-checkout-btn"
                disabled={checkoutMutation.isPending || isAuthLoading}
                onClick={handleCheckout}
              >
                <span>Pagar pedido</span>
                <ArrowRight size={18} />
              </button>

              <div className="secure-checkout-notice">
                <ShieldCheck size={16} />
                <span>Pago protegido con custodia de fondos Sercio</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PayCloud Dynamic QR Modal */}
      {qrModalOpen && activeQrData && (
        <Modal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title="Escaneá el QR con tu Billetera"
        >
          <div className="qr-modal-content">
            <div className="qr-timer-pill">
              <Clock size={16} />
              <span>
                Tiempo restante:{" "}
                <strong>
                  {Math.floor(qrTimerSeconds / 60)}:
                  {String(qrTimerSeconds % 60).padStart(2, "0")}
                </strong>
              </span>
            </div>

            <div className="qr-image-frame">
              {activeQrData.qr_image_url ? (
                <img src={activeQrData.qr_image_url} alt="QR" />
              ) : (
                <QrCode size={180} />
              )}
            </div>

            <p className="qr-hint">
              Abrí tu app bancaria o billetera (Mercado Pago, MODO, BNA+, Ualá, etc.)
              y escaneá este código QR interoperable.
            </p>

            <div className="qr-amount-pill">
              <span>Total a transferir:</span>
              <strong>${activeQrData.total_amount.toLocaleString("es-AR")}</strong>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setQrModalOpen(false);
                router.push(`${ROUTES.dashboard}?view=purchases`);
              }}
            >
              Ya realicé el pago
            </button>
            <ReturnsPolicyLink />
          </div>
        </Modal>
      )}
    </div>
  );
}
