"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  commerceService,
  OrderSummary,
  OrderStatus,
  PageResponse,
} from "@/services/commerceService";
import Pagination from "@/components/Pagination/Pagination";
import Modal from "@/components/Modal/Modal";
import { useAlert } from "@/context/AlertContext";
import "./BuyerOrdersSection.css";

export default function BuyerOrdersSection() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);

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

  const confirmReceiptMutation = useMutation({
    mutationFn: (orderId: string) => commerceService.confirmReceipt(orderId),
    onSuccess: () => {
      showSuccess("Recepción confirmada. ¡Gracias por tu compra!");
      queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
      refetch();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: "delivered" });
      }
    },
    onError: () => showError("No se pudo confirmar la recepción."),
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <span className="buyer-badge buyer-badge--pending">Pendiente de confirmación</span>;
      case "confirmed":
        return <span className="buyer-badge buyer-badge--confirmed">Confirmado</span>;
      case "preparing":
        return <span className="buyer-badge buyer-badge--preparing">En preparación</span>;
      case "ready_for_pickup":
        return <span className="buyer-badge buyer-badge--ready">Listo para retirar</span>;
      case "dispatched":
      case "in_transit":
        return <span className="buyer-badge buyer-badge--transit">En camino</span>;
      case "delivered":
        return <span className="buyer-badge buyer-badge--delivered">Entregado</span>;
      case "cancelled":
        return <span className="buyer-badge buyer-badge--cancelled">Cancelado</span>;
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
    notes?: string | null
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
        title
      )}&dates=${dates}&details=${encodeURIComponent(details)}`;
    } catch {
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
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
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="buyer-state buyer-state--empty">
          <ShoppingBag size={48} />
          <h3>Aún no realizaste ninguna compra</h3>
          <p>Explorá los productos y servicios de comercios locales en Sercio.</p>
        </div>
      ) : (
        <div className="buyer-orders-list">
          {orders.map((order) => {
            const article =
              order.professional_product?.product?.name ||
              order.service?.name ||
              (order.items && order.items[0]?.product_name) ||
              "Artículo";
            const imageUrl =
              order.professional_product?.product?.image_url ||
              (order.items && order.items[0]?.product_image);

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
                      {(order.service_id || order.service) && (
                        <div className="buyer-order-service-tag">
                          {order.appointment ? (
                            <span className="buyer-badge buyer-badge--scheduled">
                              <CalendarCheck size={12} /> Turno: {order.appointment.appointment_date} {order.appointment.appointment_time}hs
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
                    <span className="buyer-order-total-label">Total pagado:</span>
                    <span className="buyer-order-total-amount">
                      ${Number(order.total_amount ?? 0).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                <div className="buyer-order-card__footer">
                  <button
                    type="button"
                    className="btn-secondary buyer-view-detail-btn"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye size={16} />
                    <span>Ver detalle y seguimiento</span>
                  </button>
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
          onClose={() => setSelectedOrder(null)}
          title={`Pedido #${selectedOrder.order_number || selectedOrder.id.slice(0, 8)}`}
        >
          <div className="buyer-order-modal">
            {/* Status step tracker */}
            <div className="buyer-step-tracker">
              <div className="tracker-step tracker-step--done">
                <CheckCircle2 size={18} />
                <span>Confirmado</span>
              </div>
              <div
                className={`tracker-step ${
                  selectedOrder.status === "preparing" ||
                  selectedOrder.status === "ready_for_pickup" ||
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

            {/* Service Appointment Section */}
            {(selectedOrder.service_id || selectedOrder.service) && (
              <div className="buyer-appointment-card">
                {selectedOrder.appointment ? (
                  <div className="buyer-appointment-content buyer-appointment-content--scheduled">
                    <div className="buyer-appointment-header">
                      <div className="buyer-appointment-icon-box buyer-appointment-icon-box--success">
                        <CalendarCheck size={24} />
                      </div>
                      <div>
                        <h4 className="buyer-appointment-title">Turno Confirmado</h4>
                        <span className="buyer-appointment-sub">
                          Coordinado con el profesional
                        </span>
                      </div>
                    </div>
                    <div className="buyer-appointment-details">
                      <div className="buyer-appointment-detail-item">
                        <span className="buyer-appointment-label">Fecha programada:</span>
                        <strong className="buyer-appointment-value">
                          {selectedOrder.appointment.appointment_date}
                        </strong>
                      </div>
                      <div className="buyer-appointment-detail-item">
                        <span className="buyer-appointment-label">Horario:</span>
                        <strong className="buyer-appointment-value">
                          {selectedOrder.appointment.appointment_time} hs
                        </strong>
                      </div>
                      {selectedOrder.appointment.notes && (
                        <div className="buyer-appointment-detail-item buyer-appointment-detail-item--full">
                          <span className="buyer-appointment-label">Indicaciones:</span>
                          <p className="buyer-appointment-notes">{selectedOrder.appointment.notes}</p>
                        </div>
                      )}
                    </div>
                    <a
                      href={buildGoogleCalendarUrl(
                        `Turno Sercio: ${selectedOrder.service?.name || "Servicio Contratado"}`,
                        selectedOrder.appointment.appointment_date,
                        selectedOrder.appointment.appointment_time,
                        selectedOrder.appointment.notes
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
                        <h4 className="buyer-appointment-title">Turno en Coordinación</h4>
                        <span className="buyer-appointment-sub">
                          Pendiente de asignación por el profesional
                        </span>
                      </div>
                    </div>
                    <p className="buyer-appointment-notice">
                      El profesional está coordinando la fecha y hora de tu turno. Te notificaremos en cuanto esté listo.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pickup QR & Code */}
            {selectedOrder.delivery_type === "pickup" && (
              <div className="buyer-pickup-info-card">
                <h4>Código para Retiro en Sucursal</h4>
                <p>
                  Presentá este código de 7 caracteres o mostrá la pantalla al
                  llegar al comercio:
                </p>
                <div className="pickup-code-display">
                  <span>{selectedOrder.pickup_code || "8492015"}</span>
                </div>
                <div className="pickup-qr-visual">
                  <QrCode size={64} />
                  <span>Código QR de entrega</span>
                </div>
              </div>
            )}

            {/* Shipment tracking */}
            {selectedOrder.delivery_type === "shipment" && (
              <div className="buyer-shipment-tracking-card">
                <h4>Seguimiento de Envío a Domicilio</h4>
                <p>
                  Tu pedido se encuentra asignado a la red de logística local.
                </p>
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
                        <ExternalLink size={16} /> Rastrear en el sitio oficial
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
            {selectedOrder.status !== "delivered" &&
              selectedOrder.status !== "cancelled" && (
                <div className="buyer-confirm-receipt-box">
                  <p>
                    ¿Ya recibiste tu producto en tus manos y está en orden?
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={confirmReceiptMutation.isPending}
                    onClick={() =>
                      confirmReceiptMutation.mutate(selectedOrder.id)
                    }
                  >
                    Confirmar recepción del producto
                  </button>
                </div>
              )}
          </div>
        </Modal>
      )}
    </div>
  );
}
