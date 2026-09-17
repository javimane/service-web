"use client";

import React, { useState, useEffect } from "react";
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
  PayCloudQrResponse,
} from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import { ROUTES } from "@/routes/paths";
import "./CartSection.css";

export default function CartSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [destZip, setDestZip] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [cityAddress, setCityAddress] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"getnet" | "paycloud_qr">("paycloud_qr");
  const [installments, setInstallments] = useState(1);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrData, setActiveQrData] = useState<PayCloudQrResponse | null>(null);
  const [qrTimerSeconds, setQrTimerSeconds] = useState(900); // 15 min

  const {
    data: cart,
    isLoading: isCartLoading,
    isError,
    refetch: refetchCart,
  } = useQuery<Cart>({
    queryKey: ["user-cart"],
    queryFn: () => commerceService.cart(),
  });

  const items = cart?.items ?? [];
  const merchantId = cart?.professional_id || 1;

  // Fetch branches for merchant if pickup selected
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["merchant-branches", merchantId],
    queryFn: () => commerceService.branches(merchantId),
    enabled: Boolean(merchantId),
  });

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      const firstPickup = branches.find((b) => b.is_pickup_point) || branches[0];
      setSelectedBranchId(firstPickup.id);
    }
  }, [branches, selectedBranchId]);

  // Mutations
  const updateQtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      commerceService.updateCartItem(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-cart"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => commerceService.removeCartItem(id),
    onSuccess: () => {
      showSuccess("Artículo eliminado del carrito.");
      queryClient.invalidateQueries({ queryKey: ["user-cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => commerceService.clearCart(),
    onSuccess: () => {
      showSuccess("Carrito vaciado.");
      queryClient.invalidateQueries({ queryKey: ["user-cart"] });
    },
  });

  const calculateShippingMutation = useMutation({
    mutationFn: () =>
      commerceService.calculateShipping({
        merchant_id: merchantId,
        destination_zip: destZip.trim(),
        items_count: items.reduce((acc, i) => acc + i.quantity, 0),
      }),
    onSuccess: (rates) => {
      if (rates && rates.length > 0) {
        setShippingCost(rates[0].price);
        setEstimatedTime(rates[0].estimated_delivery);
        showSuccess("Costo de envío calculado.");
      } else {
        setShippingCost(1800);
        setEstimatedTime("24 - 48 hs hábiles");
      }
    },
    onError: () => {
      setShippingCost(1800);
      setEstimatedTime("24 - 48 hs hábiles");
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      commerceService.checkout({
        professional_id: merchantId,
        delivery_type: deliveryType,
        branch_id: deliveryType === "pickup" ? selectedBranchId : undefined,
        shipping_address:
          deliveryType === "shipment"
            ? {
                street: streetAddress,
                number: "123",
                city: cityAddress || "Buenos Aires",
                state: "Buenos Aires",
                zip_code: destZip,
              }
            : undefined,
        shipping_cost: deliveryType === "shipment" ? shippingCost : 0,
        payment_method: paymentMethod,
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

  const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const total = subtotal + (deliveryType === "shipment" ? shippingCost : 0);

  // Check if any product is perishable or has installment limits
  const hasPerishable = items.some((i) => i.product?.is_food_perishable);
  const maxInstallments = hasPerishable
    ? 1
    : Math.min(...items.map((i) => i.product?.max_installments || 12));

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
                Comprando en <strong>Comercio #{merchantId}</strong>. Cada pedido se
                procesa individualmente por comercio para asegurar el despacho.
              </span>
            </div>

            <div className="cart-items-list">
              {items.map((item) => {
                const name = item.product?.name || item.service?.name || "Artículo";
                const img = item.product?.image_url;
                const unitPrice = item.product?.price || item.service?.price || 0;

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
                        {item.variant && (
                          <span className="cart-item-variant">
                            {item.variant.attribute_name}: {item.variant.attribute_value}
                          </span>
                        )}
                        <span className="cart-item-unit-price">
                          ${unitPrice.toLocaleString("es-AR")} c/u
                        </span>
                      </div>
                    </div>

                    <div className="cart-item-card__actions">
                      <div className="cart-qty-control">
                        <button
                          type="button"
                          className="qty-btn"
                          disabled={item.quantity <= 1 || updateQtyMutation.isPending}
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
                <button
                  type="button"
                  className={`delivery-option ${
                    deliveryType === "pickup" ? "delivery-option--active" : ""
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
                    deliveryType === "shipment" ? "delivery-option--active" : ""
                  }`}
                  onClick={() => setDeliveryType("shipment")}
                >
                  <Truck size={20} />
                  <div>
                    <strong>Envío a domicilio</strong>
                    <p>Por rider o transporte asignado</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`delivery-option ${
                    deliveryType === "coordinate_with_merchant"
                      ? "delivery-option--active"
                      : ""
                  }`}
                  onClick={() => setDeliveryType("coordinate_with_merchant")}
                >
                  <Clock size={20} />
                  <div>
                    <strong>Acordar con vendedor</strong>
                    <p>Para coordinar logística particular</p>
                  </div>
                </button>
              </div>

              {/* Pickup branch selection */}
              {deliveryType === "pickup" && (
                <div className="delivery-details-subbox">
                  <label className="commercial-label">Seleccionar sucursal de retiro:</label>
                  {branches.length === 0 ? (
                    <p className="no-branches-warning">
                      El comercio no tiene sucursales cargadas aún. Se coordinará por mensajería.
                    </p>
                  ) : (
                    <select
                      className="branch-select"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.street} {b.number} ({b.opening_hours || "Horario comercial"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Shipping address & calculator */}
              {deliveryType === "shipment" && (
                <div className="delivery-details-subbox">
                  <div className="shipping-calc-row">
                    <input
                      type="text"
                      placeholder="Código Postal (ej: 1425)"
                      value={destZip}
                      onChange={(e) => setDestZip(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={!destZip || calculateShippingMutation.isPending}
                      onClick={() => calculateShippingMutation.mutate()}
                    >
                      Calcular costo
                    </button>
                  </div>

                  <div className="shipping-address-fields">
                    <input
                      type="text"
                      placeholder="Calle y altura (ej: Av. Libertador 2200)"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Localidad / Barrio"
                      value={cityAddress}
                      onChange={(e) => setCityAddress(e.target.value)}
                    />
                  </div>

                  {shippingCost > 0 && (
                    <div className="shipping-result-badge">
                      <span>Costo estimado: <strong>${shippingCost.toLocaleString("es-AR")}</strong></span>
                      <span>Plazo: <strong>{estimatedTime || "24 - 48 hs"}</strong></span>
                    </div>
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
                <span>Subtotal productos:</span>
                <span>${subtotal.toLocaleString("es-AR")}</span>
              </div>

              <div className="cart-summary-row">
                <span>Envío:</span>
                <span>
                  {deliveryType === "pickup"
                    ? "Gratis"
                    : deliveryType === "coordinate_with_merchant"
                    ? "A convenir"
                    : `$${shippingCost.toLocaleString("es-AR")}`}
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
                    <strong>QR Interoperable PayCloud</strong>
                    <p>Pagá con cualquier billetera (Mercado Pago, MODO, Cuenta DNI)</p>
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
                    <strong>Tarjeta de Crédito / Débito (Getnet)</strong>
                    <p>Hasta 12 cuotas bancarias habilitadas</p>
                  </div>
                </div>
              </div>

              {/* Installments selector for Getnet */}
              {paymentMethod === "getnet" && (
                <div className="installments-box">
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

              <button
                type="button"
                className="btn-primary cart-checkout-btn"
                disabled={checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate()}
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
                <img src={activeQrData.qr_image_url} alt="QR PayCloud" />
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
          </div>
        </Modal>
      )}
    </div>
  );
}
