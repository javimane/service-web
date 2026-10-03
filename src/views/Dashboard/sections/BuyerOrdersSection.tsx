"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  QrCode,
  ExternalLink,
  MapPin,
  Truck,
  Eye,
  FileText,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Star,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import {
  commerceService,
  OrderSummary,
  OrderStatus,
  PageResponse,
  ReturnTicket,
} from "@/services/commerceService";
import Pagination from "@/components/Pagination/Pagination";
import Modal from "@/components/Modal/Modal";
import ReturnsPolicyLink from "@/components/ReturnsPolicyLink/ReturnsPolicyLink";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import OrderReviewModal from "./OrderReviewModal";
import OrderChatModal from "./OrderChatModal";
import { getProductImage } from "./orderTicketData";
import ReturnTicketModal from "./ReturnTicketModal";
import "./BuyerOrdersSection.css";

export default function BuyerOrdersSection() {
  const token = getAccessToken();
  setApiAccessToken(token);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [chatOrder, setChatOrder] = useState<OrderSummary | null>(null);
  const [reviewOrder, setReviewOrder] = useState<OrderSummary | null>(null);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimReason, setClaimReason] = useState("");
  const [claimType, setClaimType] = useState("Reclamo");
  const [returnTicket, setReturnTicket] = useState<ReturnTicket | null>(null);

  const {
    data: ordersData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PageResponse<OrderSummary>>({
    queryKey: ["buyer-orders", page],
    queryFn: () => commerceService.buyerOrders(page, 10),
  });

  const orders = ordersData?.items ?? ordersData?.data ?? [];
  const total = ordersData?.total ?? orders.length;
  const totalPages = ordersData?.totalPages ?? (Math.ceil(total / 10) || 1);

  const {
    data: detailedOrder,
    isFetching: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ["buyer-order-detail", selectedOrder?.id],
    queryFn: () => commerceService.orderDetail(selectedOrder!.id),
    enabled: Boolean(selectedOrder?.id),
  });

  useEffect(() => {
    if (detailedOrder && detailedOrder.id === selectedOrder?.id) {
      setSelectedOrder(detailedOrder);
    }
  }, [detailedOrder, selectedOrder?.id]);

  const withdrawalMutation = useMutation({
    mutationFn: () =>
      commerceService.requestWithdrawal(
        selectedOrder!.id,
        withdrawalReason || undefined,
      ),
    onSuccess: async () => {
      showSuccess(
        "Recibimos tu solicitud de arrepentimiento. Te avisaremos cuando se revise.",
      );
      setWithdrawalOpen(false);
      setWithdrawalReason("");
      queryClient.invalidateQueries({
        queryKey: ["buyer-order-detail", selectedOrder?.id],
      });
      if (selectedOrder?.status === "delivered" && !selectedOrder.service_id) {
        try {
          setReturnTicket(await commerceService.returnTicket(selectedOrder.id));
        } catch {
          showError(
            "La solicitud se envió, pero no se pudo cargar el comprobante. Podés abrirlo desde el detalle de la compra.",
          );
        }
      }
    },
    onError: (error: Error) =>
      showError(error.message || "No se pudo enviar la solicitud."),
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      commerceService.cancelOrder(
        selectedOrder!.id,
        cancelReason.trim() || undefined,
      ),
    onSuccess: (updated) => {
      setSelectedOrder(updated);
      setCancelOpen(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["buyer-order-detail", selectedOrder?.id],
      });
      showSuccess("Compra pendiente cancelada.");
    },
    onError: (error: Error) =>
      showError(error.message || "No se pudo cancelar la compra."),
  });

  const claimMutation = useMutation({
    mutationFn: () =>
      commerceService.createClaim(
        selectedOrder!.id,
        `${claimType}: ${claimReason.trim()}`,
      ),
    onSuccess: async () => {
      setClaimOpen(false);
      setClaimReason("");
      queryClient.invalidateQueries({
        queryKey: ["buyer-order-detail", selectedOrder?.id],
      });
      showSuccess("Reclamo iniciado. Te avisaremos cuando haya novedades.");
      if (
        selectedOrder?.status === "delivered" &&
        !selectedOrder.service_id &&
        claimType !== "Reclamo"
      ) {
        try {
          setReturnTicket(await commerceService.returnTicket(selectedOrder.id));
        } catch {
          showError(
            "El reclamo se envió, pero no se pudo cargar el comprobante de devolución.",
          );
        }
      }
    },
    onError: (error: Error) =>
      showError(error.message || "No se pudo iniciar el reclamo."),
  });

  const openReturnTicket = async (orderId: string) => {
    try {
      setReturnTicket(await commerceService.returnTicket(orderId));
    } catch (error) {
      showError(
        (error as Error).message ||
          "No se pudo cargar el comprobante de devolución.",
      );
    }
  };

  const confirmReceiptMutation = useMutation({
    mutationFn: (orderId: string) => commerceService.confirmReceipt(orderId),
    onSuccess: () => {
      showSuccess("Recepción confirmada. ¡Gracias por tu compra!");
      queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
      refetch();
      if (selectedOrder) {
        const updated = {
          ...selectedOrder,
          status: "delivered" as OrderStatus,
        };
        setSelectedOrder(updated);
        setReviewOrder(updated);
      }
    },
    onError: () => showError("No se pudo confirmar la recepción."),
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="buyer-badge buyer-badge--pending">
            Pendiente de confirmación
          </span>
        );
      case "pending_payment":
        return (
          <span className="buyer-badge buyer-badge--pending">
            Pendiente de pago
          </span>
        );
      case "paid":
        return (
          <span className="buyer-badge buyer-badge--confirmed">
            Pago confirmado
          </span>
        );
      case "confirmed":
        return (
          <span className="buyer-badge buyer-badge--confirmed">Confirmado</span>
        );
      case "preparing":
        return (
          <span className="buyer-badge buyer-badge--preparing">
            En preparación
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="buyer-badge buyer-badge--ready">
            Listo para retirar
          </span>
        );
      case "ready_for_dispatch":
        return (
          <span className="buyer-badge buyer-badge--ready">
            Listo para enviar
          </span>
        );
      case "dispatched":
      case "in_transit":
        return (
          <span className="buyer-badge buyer-badge--transit">En camino</span>
        );
      case "delivered":
        return (
          <span className="buyer-badge buyer-badge--delivered">Entregado</span>
        );
      case "cancelled":
        return (
          <span className="buyer-badge buyer-badge--cancelled">Cancelado</span>
        );
      case "refunded":
        return (
          <span className="buyer-badge buyer-badge--cancelled">
            Reembolsado
          </span>
        );
      default:
        return <span className="buyer-badge">{status}</span>;
    }
  };

  const getDeliveryText = (type: string) => {
    switch (type) {
      case "pickup":
        return "Retiro en sucursal";
      case "shipment":
        return "Envío a domicilio";
      case "coordinate_with_merchant":
        return "Acordar con vendedor";
      default:
        return type;
    }
  };

  const buildGoogleCalendarUrl = (
    title: string,
    dateStr: string,
    timeStr: string,
    notes?: string | null,
  ) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      const start = new Date(year, month - 1, day, hours, minutes);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const pad = (n: number) => String(n).padStart(2, "0");
      const formatGCal = (d: Date) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

      const dates = `${formatGCal(start)}/${formatGCal(end)}`;
      const details = notes
        ? `Turno coordinado en Sercio. Notas: ${notes}`
        : "Turno coordinado en Sercio.";
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title,
      )}&dates=${dates}&details=${encodeURIComponent(details)}`;
    } catch {
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title,
      )}`;
    }
  };

  return (
    <div className="buyer-orders-section">
      <header className="buyer-orders-section__header">
        <div>
          <span className="buyer-orders-section__subtitle">Mis Compras</span>
          <h1 className="buyer-orders-section__title">Historial de Pedidos</h1>
        </div>
      </header>

      {/* List or States */}
      {isLoading ? (
        <div className="buyer-state buyer-state--loading">
          <Clock className="buyer-state__spinner" size={32} />
          <p>Cargando tus compras...</p>
        </div>
      ) : isError ? (
        <div className="buyer-state buyer-state--error">
          <AlertCircle size={32} />
          <p>Error al obtener tus compras.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="buyer-state buyer-state--empty">
          <ShoppingBag size={48} />
          <h3>Aún no realizaste ninguna compra</h3>
          <p>
            Explorá los productos y servicios de comercios locales en Sercio.
          </p>
        </div>
      ) : (
        <div className="buyer-orders-list">
          {orders.map((order) => {
            const article =
              order.items?.find((item) => item.product)?.product?.name ||
              order.professional_product?.product?.name ||
              order.service?.name ||
              (order.items && order.items[0]?.product_name) ||
              "Artículo";
            const imageUrl =
              getProductImage(
                order.items?.find((item) => item.product)?.product,
              ) ||
              getProductImage(order.professional_product?.product) ||
              order.items?.find((item) => item.product_image)?.product_image;

            return (
              <div key={order.id} className="buyer-order-card">
                <div className="buyer-order-card__header">
                  <div>
                    <span className="buyer-order-number">
                      Orden #{order.order_number || order.id.slice(0, 8)}
                    </span>
                    <span className="buyer-order-date">
                      {new Date(order.created_at).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="buyer-order-card__body">
                  <div className="buyer-order-product">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={article}
                        className="buyer-order-thumb"
                      />
                    )}
                    <div>
                      <h3 className="buyer-order-title">{article}</h3>
                      <span className="buyer-order-delivery">
                        {getDeliveryText(order.delivery_type)}
                      </span>
                      {order.scheduled_delivery_date && (
                        <span className="buyer-order-schedule">
                          Envío programado:{" "}
                          {order.scheduled_delivery_date
                            .split("-")
                            .reverse()
                            .join("/")}
                        </span>
                      )}
                      {(order.service_id || order.service) && (
                        <div className="buyer-order-service-tag">
                          {order.appointment ? (
                            <span className="buyer-badge buyer-badge--scheduled">
                              <CalendarCheck size={12} /> Turno:{" "}
                              {order.appointment.appointment_date}{" "}
                              {order.appointment.appointment_time}hs
                            </span>
                          ) : (
                            <span className="buyer-badge buyer-badge--pending-appointment">
                              <CalendarClock size={12} /> Turno en coordinación
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="buyer-order-summary">
                    <span className="buyer-order-total-label">
                      Total de la orden:
                    </span>
                    <span className="buyer-order-total-amount">
                      ${Number(order.total_amount ?? 0).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                <div className="buyer-order-card__footer">
                  {order.status === "pending_payment" && (
                    <button
                      type="button"
                      className="btn-secondary buyer-order-action"
                      data-action-tone="cancel"
                      onClick={() => {
                        setSelectedOrder(order);
                        setCancelOpen(true);
                      }}
                    >
                      <span>Cancelar compra</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary buyer-view-detail-btn"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye size={16} />
                    <span>Ver detalle y seguimiento</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary buyer-order-chat-btn"
                    onClick={() => setChatOrder(order)}
                  >
                    <MessageSquare size={15} />
                    <span>Chat</span>
                  </button>

                  {order.status === "delivered" && (
                    <button
                      type="button"
                      className="buyer-review-btn"
                      onClick={() => setReviewOrder(order)}
                    >
                      <Star size={15} />
                      <span>Calificar compra</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <Pagination
            page={page}
            totalPages={totalPages}
            hasPrev={page > 1}
            hasNext={page < totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            onPage={setPage}
          />
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => {
            setSelectedOrder(null);
            setWithdrawalOpen(false);
          }}
          title={`Pedido #${selectedOrder.order_number || selectedOrder.id.slice(0, 8)}`}
        >
          <div className="buyer-order-modal">
            {/* Status step tracker */}
            {selectedOrder.status === "pending_payment" ||
            selectedOrder.status === "cancelled" ||
            selectedOrder.status === "refunded" ? (
              <div className="buyer-order-modal__current-status">
                {getStatusBadge(selectedOrder.status)}
                {selectedOrder.status === "pending_payment" && (
                  <span>La compra todavía no tiene un pago confirmado.</span>
                )}
              </div>
            ) : (
              <div className="buyer-step-tracker">
                <div className="tracker-step tracker-step--done">
                  <CheckCircle2 size={18} />
                  <span>Pago confirmado</span>
                </div>
                <div
                  className={`tracker-step ${
                    selectedOrder.status === "preparing" ||
                    selectedOrder.status === "confirmed" ||
                    selectedOrder.status === "ready_for_pickup" ||
                    selectedOrder.status === "ready_for_dispatch" ||
                    selectedOrder.status === "dispatched" ||
                    selectedOrder.status === "delivered"
                      ? "tracker-step--done"
                      : ""
                  }`}
                >
                  <PackageCheck size={18} />
                  <span>Preparación</span>
                </div>
                <div
                  className={`tracker-step ${
                    selectedOrder.status === "ready_for_pickup" ||
                    selectedOrder.status === "ready_for_dispatch" ||
                    selectedOrder.status === "dispatched" ||
                    selectedOrder.status === "delivered"
                      ? "tracker-step--done"
                      : ""
                  }`}
                >
                  <Truck size={18} />
                  <span>
                    {selectedOrder.delivery_type === "pickup"
                      ? "Listo retiro"
                      : "En camino"}
                  </span>
                </div>
                <div
                  className={`tracker-step ${
                    selectedOrder.status === "delivered"
                      ? "tracker-step--done"
                      : ""
                  }`}
                >
                  <CheckCircle2 size={18} />
                  <span>Entregado</span>
                </div>
              </div>
            )}

            <ReturnsPolicyLink />

            {isLoadingDetail && (
              <p className="buyer-order-modal__loading">
                Cargando detalles de la compra...
              </p>
            )}
            {isDetailError && (
              <div className="buyer-order-modal__detail-error">
                <span>No se pudieron cargar todos los datos del pedido.</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => refetchDetail()}
                >
                  Reintentar
                </button>
              </div>
            )}
            <section
              className="buyer-order-modal__details"
              aria-label="Datos de la compra"
            >
              <h4>Datos de la compra</h4>
              <div className="buyer-order-modal__detail-grid">
                <div>
                  <span>Realizada el</span>
                  <strong>
                    {new Date(selectedOrder.created_at).toLocaleString(
                      "es-AR",
                      { dateStyle: "long", timeStyle: "short" },
                    )}
                  </strong>
                </div>
                <div>
                  <span>Forma de entrega</span>
                  <strong>
                    {getDeliveryText(selectedOrder.delivery_type)}
                  </strong>
                </div>
                <div>
                  <span>Medio de pago</span>
                  <strong>
                    {selectedOrder.payment_method === "paycloud_qr"
                      ? "QR"
                      : selectedOrder.payment_method === "getnet_card"
                        ? "Tarjeta"
                        : selectedOrder.payment_method || "Sin información"}
                  </strong>
                </div>
                <div>
                  <span>Cuotas</span>
                  <strong>
                    {selectedOrder.installments
                      ? `${selectedOrder.installments} ${selectedOrder.installments === 1 ? "cuota" : "cuotas"}`
                      : "Sin información"}
                  </strong>
                </div>
                {selectedOrder.paid_at && (
                  <div>
                    <span>Pago confirmado el</span>
                    <strong>
                      {new Date(selectedOrder.paid_at).toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </strong>
                  </div>
                )}
                {selectedOrder.cancelled_at && (
                  <div>
                    <span>Cancelada el</span>
                    <strong>
                      {new Date(selectedOrder.cancelled_at).toLocaleString(
                        "es-AR",
                        { dateStyle: "short", timeStyle: "short" },
                      )}
                    </strong>
                  </div>
                )}
                <div>
                  <span>Envío</span>
                  <strong>
                    $
                    {Number(selectedOrder.shipping_cost ?? 0).toLocaleString(
                      "es-AR",
                    )}
                  </strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>
                    $
                    {Number(selectedOrder.total_amount ?? 0).toLocaleString(
                      "es-AR",
                    )}
                  </strong>
                </div>
              </div>
              {selectedOrder.cancel_reason && (
                <p className="buyer-order-modal__cancel-reason">
                  <strong>Motivo de cancelación o error:</strong>{" "}
                  {selectedOrder.cancel_reason}
                </p>
              )}
            </section>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <section
                className="buyer-order-modal__items"
                aria-label="Artículos comprados"
              >
                <h4>Artículos de la compra</h4>
                {selectedOrder.items.map((item) => {
                  const attributes = item.product?.attributes;
                  const attributeText = Array.isArray(attributes)
                    ? attributes
                        .filter(
                          (attribute) => attribute.name && attribute.value,
                        )
                        .map(
                          (attribute) =>
                            `${attribute.name}: ${attribute.value}`,
                        )
                        .join(" · ")
                    : attributes
                      ? Object.entries(attributes)
                          .map(([name, value]) => `${name}: ${value}`)
                          .join(" · ")
                      : "";
                  return (
                    <div className="buyer-order-modal__item" key={item.id}>
                      <div>
                        <strong>
                          {item.product?.name ||
                            item.service?.name ||
                            item.product_name ||
                            "Artículo"}
                        </strong>
                        {attributeText && <span>{attributeText}</span>}
                        {item.product?.brand && (
                          <span>Marca: {item.product.brand}</span>
                        )}
                        {item.product?.ean && (
                          <span>EAN: {item.product.ean}</span>
                        )}
                        <span>
                          Cantidad: {item.quantity} · Precio unitario: $
                          {Number(item.unit_price).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <strong>
                        ${Number(item.subtotal).toLocaleString("es-AR")}
                      </strong>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Service Appointment Section */}
            {(selectedOrder.service_id || selectedOrder.service) &&
              !["pending_payment", "cancelled", "refunded"].includes(
                selectedOrder.status,
              ) && (
                <div className="buyer-appointment-card">
                  {selectedOrder.appointment ? (
                    <div className="buyer-appointment-content buyer-appointment-content--scheduled">
                      <div className="buyer-appointment-header">
                        <div className="buyer-appointment-icon-box buyer-appointment-icon-box--success">
                          <CalendarCheck size={24} />
                        </div>
                        <div>
                          <h4 className="buyer-appointment-title">
                            Turno Confirmado
                          </h4>
                          <span className="buyer-appointment-sub">
                            Coordinado con el profesional
                          </span>
                        </div>
                      </div>
                      <div className="buyer-appointment-details">
                        <div className="buyer-appointment-detail-item">
                          <span className="buyer-appointment-label">
                            Fecha programada:
                          </span>
                          <strong className="buyer-appointment-value">
                            {selectedOrder.appointment.appointment_date}
                          </strong>
                        </div>
                        <div className="buyer-appointment-detail-item">
                          <span className="buyer-appointment-label">
                            Horario:
                          </span>
                          <strong className="buyer-appointment-value">
                            {selectedOrder.appointment.appointment_time} hs
                          </strong>
                        </div>
                        {selectedOrder.appointment.notes && (
                          <div className="buyer-appointment-detail-item buyer-appointment-detail-item--full">
                            <span className="buyer-appointment-label">
                              Indicaciones:
                            </span>
                            <p className="buyer-appointment-notes">
                              {selectedOrder.appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <a
                        data-action-tone="add"
                        href={buildGoogleCalendarUrl(
                          `Turno Sercio: ${selectedOrder.service?.name || "Servicio Contratado"}`,
                          selectedOrder.appointment.appointment_date,
                          selectedOrder.appointment.appointment_time,
                          selectedOrder.appointment.notes,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="buyer-gcal-btn"
                      >
                        <Calendar size={16} />
                        <span>Agregar a Google Calendar</span>
                      </a>
                    </div>
                  ) : (
                    <div className="buyer-appointment-content buyer-appointment-content--pending">
                      <div className="buyer-appointment-header">
                        <div className="buyer-appointment-icon-box buyer-appointment-icon-box--pending">
                          <CalendarClock size={24} />
                        </div>
                        <div>
                          <h4 className="buyer-appointment-title">
                            Turno en Coordinación
                          </h4>
                          <span className="buyer-appointment-sub">
                            Pendiente de asignación por el profesional
                          </span>
                        </div>
                      </div>
                      <p className="buyer-appointment-notice">
                        El profesional está coordinando la fecha y hora de tu
                        turno. Te notificaremos en cuanto esté listo.
                      </p>
                    </div>
                  )}
                </div>
              )}

            {/* Pickup QR & Code */}
            {selectedOrder.delivery_type === "pickup" &&
              !["pending_payment", "cancelled", "refunded"].includes(
                selectedOrder.status,
              ) &&
              Boolean(selectedOrder.pickup_code) && (
                <div className="buyer-pickup-info-card">
                  <h4>Código para Retiro en Sucursal</h4>
                  <p>
                    Presentá este código de 7 caracteres o mostrá la pantalla al
                    llegar al comercio:
                  </p>
                  <div className="pickup-code-display">
                    <span>{selectedOrder.pickup_code}</span>
                  </div>
                  <div className="pickup-qr-visual">
                    <QrCode size={64} />
                    <span>Código QR de entrega</span>
                  </div>
                </div>
              )}

            {/* Shipment tracking */}
            {selectedOrder.delivery_type === "shipment" &&
              !["pending_payment", "cancelled", "refunded"].includes(
                selectedOrder.status,
              ) && (
                <div className="buyer-shipment-tracking-card">
                  <h4>Seguimiento de Envío a Domicilio</h4>
                  {selectedOrder.scheduled_delivery_date && (
                    <p>
                      Envío programado para el{" "}
                      {selectedOrder.scheduled_delivery_date
                        .split("-")
                        .reverse()
                        .join("/")}
                      .
                    </p>
                  )}
                  <p>
                    Tu pedido se encuentra asignado a la red de logística local.
                  </p>
                  {selectedOrder.shipment_status && (
                    <p>Estado del envío: {selectedOrder.shipment_status}</p>
                  )}
                  {selectedOrder.transport_shipment && (
                    <div className="transport-info-box">
                      <p>
                        <strong>Empresa de transporte:</strong>{" "}
                        {selectedOrder.transport_shipment.carrier_name}
                      </p>
                      <p>
                        <strong>Número de guía:</strong>{" "}
                        {selectedOrder.transport_shipment.tracking_number}
                      </p>
                      {selectedOrder.transport_shipment.tracking_url && (
                        <a
                          href={selectedOrder.transport_shipment.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="external-track-link"
                        >
                          <ExternalLink size={16} /> Rastrear en el sitio
                          oficial
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Invoice download */}
            {selectedOrder.invoice_url && (
              <div className="buyer-invoice-row">
                <a
                  href={selectedOrder.invoice_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  <FileText size={16} />
                  <span>Descargar Factura del Pedido</span>
                </a>
              </div>
            )}

            {/* Confirm Receipt Action */}
            {["dispatched", "in_transit"].includes(selectedOrder.status) &&
              selectedOrder.shipment_id && (
                <div className="buyer-confirm-receipt-box">
                  <p>¿Ya recibiste tu producto en tus manos y está en orden?</p>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={confirmReceiptMutation.isPending}
                    onClick={() =>
                      confirmReceiptMutation.mutate(selectedOrder.shipment_id!)
                    }
                  >
                    Confirmar recepción del producto
                  </button>
                </div>
              )}

            {/* Review Purchase Action */}
            {selectedOrder.status === "delivered" && (
              <div className="buyer-review-action-row">
                <button
                  type="button"
                  className="buyer-review-btn"
                  onClick={() => setReviewOrder(selectedOrder)}
                >
                  <Star size={16} />
                  <span>Dejar reseña sobre esta compra</span>
                </button>
              </div>
            )}

            {/* Contact merchant by Chat */}
            <div className="buyer-order-chat-action">
              <button
                type="button"
                className="btn-primary buyer-chat-modal-btn"
                onClick={() => setChatOrder(selectedOrder)}
              >
                <MessageSquare size={18} />
                <span>Contactar al comercio por Chat</span>
              </button>
            </div>

            {selectedOrder.status === "pending_payment" && (
              <div className="buyer-order-modal__withdrawal">
                <p>
                  Esta compra todavía no tiene un pago confirmado. Podés
                  cancelarla sin solicitar una devolución.
                </p>
                <button
                  type="button"
                  className="btn-secondary buyer-order-action"
                  data-action-tone="cancel"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancelar compra
                </button>
              </div>
            )}

            {selectedOrder.withdrawal_eligible && (
              <div className="buyer-order-modal__withdrawal">
                <p>
                  {selectedOrder.status === "delivered" &&
                  !selectedOrder.service_id
                    ? "Podés solicitar la devolución del producto. La solicitud se revisará según las políticas de devolución."
                    : "Podés solicitar la cancelación de esta compra para su revisión según las políticas de devolución."}
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setWithdrawalOpen(true)}
                >
                  {selectedOrder.status === "delivered" &&
                  !selectedOrder.service_id
                    ? "Solicitar devolución"
                    : "Solicitar cancelación"}
                </button>
              </div>
            )}
            {selectedOrder.withdrawal_requested && (
              <div className="buyer-order-modal__withdrawal">
                <p className="buyer-order-modal__withdrawal-status">
                  Tu solicitud está en revisión.
                </p>
                {selectedOrder.return_ticket_available && (
                  <>
                    <p>
                      {selectedOrder.delivery_type === "pickup"
                        ? "Llevá el producto a la sucursal donde lo retiraste. Si estás lejos, contactá al comercio para coordinar la devolución."
                        : "Contactá al comercio para coordinar el envío de regreso del producto."}
                    </p>
                    <button
                      type="button"
                      className="btn-secondary buyer-order-action"
                      onClick={() => openReturnTicket(selectedOrder.id)}
                    >
                      <RotateCcw size={16} />
                      Ver e imprimir comprobante de devolución
                    </button>
                  </>
                )}
              </div>
            )}
            {!selectedOrder.withdrawal_requested &&
              selectedOrder.return_ticket_available && (
                <div className="buyer-order-modal__withdrawal">
                  <p>Tenés una solicitud de devolución o garantía abierta.</p>
                  <button
                    type="button"
                    className="btn-secondary buyer-order-action"
                    onClick={() => openReturnTicket(selectedOrder.id)}
                  >
                    <RotateCcw size={16} />
                    Ver e imprimir comprobante de devolución
                  </button>
                </div>
              )}
            {!["pending_payment", "cancelled", "refunded"].includes(
              selectedOrder.status,
            ) && (
              <div className="buyer-order-modal__withdrawal">
                <p>
                  Si el producto tiene un problema, necesitás garantía o querés
                  informar otra incidencia, iniciá un reclamo. Si estás lejos de
                  la sucursal, contactá también al comercio para coordinar cómo
                  devolverlo.
                </p>
                {selectedOrder.claim_requested ||
                selectedOrder.withdrawal_requested ? (
                  <strong>
                    Ya tenés una solicitud abierta para esta compra.
                  </strong>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary buyer-order-action"
                    onClick={() => setClaimOpen(true)}
                  >
                    Iniciar reclamo
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {selectedOrder && withdrawalOpen && (
        <Modal
          isOpen
          onClose={() => setWithdrawalOpen(false)}
          title={
            selectedOrder.status === "delivered" && !selectedOrder.service_id
              ? "Solicitar devolución"
              : "Solicitar cancelación"
          }
        >
          <div className="buyer-order-modal__withdrawal-form">
            <p>
              La solicitud se revisará antes de cancelar o reembolsar la compra.
              Si ya tenés el producto, coordiná la entrega con el comercio antes
              de enviarlo. Podés indicar un motivo, pero no es obligatorio.
            </p>
            <label htmlFor="buyer-withdrawal-reason">Motivo (opcional)</label>
            <select
              id="buyer-withdrawal-reason"
              value={withdrawalReason}
              onChange={(event) => setWithdrawalReason(event.target.value)}
            >
              <option value="">Prefiero no indicar un motivo</option>
              <option value="Cambié de opinión">Cambié de opinión</option>
              <option value="Ya no necesito el producto o servicio">
                Ya no lo necesito
              </option>
              <option value="Compré por error">Compré por error</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>
            <div className="buyer-order-modal__withdrawal-actions">
              <button
                type="button"
                className="btn-secondary"
                data-action-tone="cancel"
                onClick={() => setWithdrawalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={withdrawalMutation.isPending}
                onClick={() => withdrawalMutation.mutate()}
              >
                {withdrawalMutation.isPending
                  ? "Enviando..."
                  : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selectedOrder && cancelOpen && (
        <Modal
          isOpen
          onClose={() => setCancelOpen(false)}
          title="Cancelar compra pendiente"
        >
          <div className="buyer-order-modal__withdrawal-form">
            <p>
              Solo podés cancelar directamente una compra que todavía está
              pendiente de pago.
            </p>
            <label htmlFor="buyer-cancel-reason">Motivo (opcional)</label>
            <textarea
              id="buyer-cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={3}
            />
            <div className="buyer-order-modal__withdrawal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCancelOpen(false)}
              >
                Volver
              </button>
              <button
                type="button"
                className="btn-secondary"
                data-action-tone="cancel"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isPending
                  ? "Cancelando..."
                  : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selectedOrder && claimOpen && (
        <Modal
          isOpen
          onClose={() => setClaimOpen(false)}
          title="Iniciar reclamo"
        >
          <div className="buyer-order-modal__withdrawal-form">
            <p>
              Contanos qué ocurrió. Para garantía o devolución desde lejos,
              coordiná con el comercio antes de enviar el producto.
            </p>
            <label htmlFor="buyer-claim-type">Tipo de reclamo</label>
            <select
              id="buyer-claim-type"
              value={claimType}
              onChange={(event) => setClaimType(event.target.value)}
            >
              <option value="Reclamo">Problema con la compra</option>
              <option value="Garantía">Garantía</option>
              <option value="Devolución">Devolución por otro motivo</option>
            </select>
            <label htmlFor="buyer-claim-reason">Descripción del problema</label>
            <textarea
              id="buyer-claim-reason"
              value={claimReason}
              onChange={(event) => setClaimReason(event.target.value)}
              rows={5}
              minLength={10}
              maxLength={1000}
              required
              placeholder="Describí el producto, el problema y qué solución necesitás"
            />
            <div className="buyer-order-modal__withdrawal-actions">
              <button
                type="button"
                className="btn-secondary"
                data-action-tone="cancel"
                onClick={() => setClaimOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                data-action-tone="add"
                disabled={
                  claimMutation.isPending || claimReason.trim().length < 10
                }
                onClick={() => claimMutation.mutate()}
              >
                {claimMutation.isPending ? "Enviando..." : "Enviar reclamo"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {returnTicket && (
        <ReturnTicketModal
          ticket={returnTicket}
          onClose={() => setReturnTicket(null)}
        />
      )}

      <OrderReviewModal
        isOpen={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
        order={reviewOrder}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
        }}
      />

      {chatOrder && (
        <OrderChatModal
          isOpen={Boolean(chatOrder)}
          onClose={() => setChatOrder(null)}
          order={chatOrder}
          currentUserId={String(user?.id || "")}
        />
      )}
    </div>
  );
}
