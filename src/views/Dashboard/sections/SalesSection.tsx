"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  PackageCheck,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Calendar,
  Eye,
  MessageCircle,
  Printer,
  AlertTriangle,
  CheckCircle2,
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
import AssignServiceAppointmentModal from "./AssignServiceAppointmentModal";
import PackageThermalLabelModal from "./PackageThermalLabelModal";
import "./SalesSection.css";

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todas", value: "" },
  { label: "Pendientes", value: "pending" },
  { label: "Confirmadas", value: "confirmed" },
  { label: "En preparación", value: "preparing" },
  { label: "Listas para retiro", value: "ready_for_pickup" },
  { label: "Despachadas", value: "dispatched" },
  { label: "Entregadas", value: "delivered" },
  { label: "Canceladas", value: "cancelled" },
];

export default function SalesSection() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [pickupCode, setPickupCode] = useState("");
  const [invoiceUrlInput, setInvoiceUrlInput] = useState("");
  const [packageImageUrl, setPackageImageUrl] = useState("");
  const [transportCarrier, setTransportCarrier] = useState("");
  const [transportTrackingNumber, setTransportTrackingNumber] = useState("");
  const [transportTrackingUrl, setTransportTrackingUrl] = useState("");
  const [selectedOrderForAppointment, setSelectedOrderForAppointment] = useState<OrderSummary | null>(null);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<OrderSummary | null>(null);

  const { data: ordersData, isLoading, isError, refetch } = useQuery<PageResponse<OrderSummary>>({
    queryKey: ["merchant-orders", page, statusFilter],
    queryFn: () => commerceService.merchantOrders(page, 10, statusFilter || undefined),
  });

  const orders = ordersData?.items ?? ordersData?.data ?? [];
  const totalOrders = ordersData?.total ?? orders.length;
  const totalPages = ordersData?.totalPages ?? (Math.ceil(totalOrders / 10) || 1);

  // Header quick metrics
  const todaySalesCount = orders.filter((o) => {
    const d = new Date(o.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const pendingPrepCount = orders.filter(
    (o) => o.status === "confirmed" || o.status === "preparing"
  ).length;

  const readyForDispatchCount = orders.filter(
    (o) => o.status === "ready_for_pickup" || o.status === "ready_for_dispatch"
  ).length;

  const monthlyBilling = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, curr) => acc + (curr.total_amount ?? 0), 0);

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: (id: string) => commerceService.confirmOrder(id),
    onSuccess: (updated) => {
      showSuccess("Pedido confirmado con éxito.");
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      setSelectedOrder(updated);
    },
    onError: () => showError("No se pudo confirmar el pedido."),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      commerceService.cancelOrder(id, reason),
    onSuccess: () => {
      showSuccess("Pedido cancelado.");
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      setCancelModalOpen(false);
      setSelectedOrder(null);
    },
    onError: () => showError("No se pudo cancelar el pedido."),
  });

  const preparingMutation = useMutation({
    mutationFn: (id: string) => commerceService.preparingShipment(id),
    onSuccess: () => {
      showSuccess("Pedido marcado en preparación.");
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      refetch();
    },
    onError: () => showError("Error al actualizar estado."),
  });

  const readyMutation = useMutation({
    mutationFn: (id: string) => commerceService.readyShipment(id),
    onSuccess: () => {
      showSuccess("Pedido marcado listo.");
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      refetch();
    },
    onError: () => showError("Error al actualizar estado."),
  });

  const pickupVerifyMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) =>
      commerceService.verifyPickup(id, code),
    onSuccess: () => {
      showSuccess("Código verificado. Entrega completada.");
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      setSelectedOrder(null);
    },
    onError: () => showError("Código de retiro inválido."),
  });

  const invoiceMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      commerceService.uploadInvoice(id, url),
    onSuccess: () => {
      showSuccess("Comprobante de factura registrado.");
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      refetch();
    },
    onError: () => showError("No se pudo guardar la factura."),
  });

  const transportMutation = useMutation({
    mutationFn: ({
      id,
      carrier_name,
      tracking_number,
      tracking_url,
    }: {
      id: string;
      carrier_name: string;
      tracking_number: string;
      tracking_url: string;
    }) =>
      commerceService.updateTransportShipment(id, {
        carrier_name,
        tracking_number,
        tracking_url,
      }),
    onSuccess: () => {
      showSuccess("Datos de transporte larga distancia actualizados.");
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      refetch();
    },
    onError: () => showError("No se pudo guardar la información de transporte."),
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <span className="sales-badge sales-badge--pending">Pendiente</span>;
      case "confirmed":
        return <span className="sales-badge sales-badge--confirmed">Confirmado</span>;
      case "preparing":
        return <span className="sales-badge sales-badge--preparing">En preparación</span>;
      case "ready_for_pickup":
        return <span className="sales-badge sales-badge--ready">Listo para retiro</span>;
      case "ready_for_dispatch":
        return <span className="sales-badge sales-badge--ready">Listo despacho</span>;
      case "dispatched":
      case "in_transit":
        return <span className="sales-badge sales-badge--transit">En tránsito</span>;
      case "delivered":
        return <span className="sales-badge sales-badge--delivered">Entregado</span>;
      case "cancelled":
        return <span className="sales-badge sales-badge--cancelled">Cancelado</span>;
      default:
        return <span className="sales-badge">{status}</span>;
    }
  };

  const getDeliveryLabel = (type: string) => {
    switch (type) {
      case "pickup":
        return "Retiro en sucursal";
      case "shipment":
        return "Envío por rider / flete";
      case "coordinate_with_merchant":
        return "Acordar con vendedor";
      default:
        return type;
    }
  };

  return (
    <div className="sales-section">
      <header className="sales-section__header">
        <div>
          <span className="sales-section__subtitle">Gestión Comercial</span>
          <h1 className="sales-section__title">Ventas</h1>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="sales-metrics">
        <div className="sales-metric-card">
          <div className="sales-metric-card__icon sales-metric-card__icon--blue">
            <Calendar size={20} />
          </div>
          <div className="sales-metric-card__info">
            <span className="sales-metric-card__label">VENTAS DE HOY</span>
            <span className="sales-metric-card__value">{todaySalesCount}</span>
          </div>
        </div>

        <div className="sales-metric-card">
          <div className="sales-metric-card__icon sales-metric-card__icon--amber">
            <Clock size={20} />
          </div>
          <div className="sales-metric-card__info">
            <span className="sales-metric-card__label">PENDIENTES PREPARACIÓN</span>
            <span className="sales-metric-card__value">{pendingPrepCount}</span>
          </div>
        </div>

        <div className="sales-metric-card">
          <div className="sales-metric-card__icon sales-metric-card__icon--teal">
            <PackageCheck size={20} />
          </div>
          <div className="sales-metric-card__info">
            <span className="sales-metric-card__label">LISTAS PARA ENTREGA / DESPACHO</span>
            <span className="sales-metric-card__value">{readyForDispatchCount}</span>
          </div>
        </div>

        <div className="sales-metric-card">
          <div className="sales-metric-card__icon sales-metric-card__icon--green">
            <DollarSign size={20} />
          </div>
          <div className="sales-metric-card__info">
            <span className="sales-metric-card__label">FACTURACIÓN ESTIMADA</span>
            <span className="sales-metric-card__value">
              ${monthlyBilling.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sales-filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`sales-filter-btn ${
              statusFilter === f.value ? "sales-filter-btn--active" : ""
            }`}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content Table / States */}
      {isLoading ? (
        <div className="sales-state sales-state--loading">
          <Clock className="sales-state__spinner" size={32} />
          <p>Cargando ventas...</p>
        </div>
      ) : isError ? (
        <div className="sales-state sales-state--error">
          <AlertCircle size={32} />
          <p>Hubo un error al cargar las ventas.</p>
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="sales-state sales-state--empty">
          <PackageCheck size={48} />
          <h3>No se encontraron ventas</h3>
          <p>Aún no hay pedidos registrados con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="sales-table-card">
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Artículo / Productos</th>
                  <th>Entrega</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const article =
                    order.professional_product?.product?.name ||
                    order.service?.name ||
                    (order.items && order.items[0]?.product_name) ||
                    "Producto";
                  const buyerName =
                    order.buyer?.full_name ||
                    order.user?.full_name ||
                    order.buyer?.email ||
                    "Cliente";

                  return (
                    <tr key={order.id}>
                      <td className="sales-table__order-id">
                        #{order.order_number || order.id.slice(0, 8)}
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString("es-AR")}</td>
                      <td>{buyerName}</td>
                      <td>
                        <div className="sales-table__product-cell">
                          {order.professional_product?.product?.image_url && (
                            <img
                              src={order.professional_product.product.image_url}
                              alt={article}
                              className="sales-table__thumb"
                            />
                          )}
                          <div className="sales-table__article-col">
                            <span>{article}</span>
                            {(order.service_id || order.service) && (
                              order.appointment_status === "pending_appointment" ? (
                                <span className="sales-badge sales-badge--appointment-pending">
                                  ⚠️ Turno Pendiente
                                </span>
                              ) : (
                                <span className="sales-badge sales-badge--appointment-scheduled">
                                  📅 Turno Asignado
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{getDeliveryLabel(order.delivery_type)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td className="sales-table__total">
                        ${Number(order.total_amount ?? 0).toLocaleString("es-AR")}
                      </td>
                      <td>
                        <div className="sales-row-actions">
                          <button
                            type="button"
                            className="sales-action-btn"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye size={15} />
                            <span>Detalle</span>
                          </button>

                          {(order.service_id || order.service) &&
                            order.appointment_status === "pending_appointment" && (
                              <button
                                type="button"
                                className="sales-action-btn sales-action-btn--appointment"
                                title="Asignar fecha y hora de turno"
                                onClick={() => setSelectedOrderForAppointment(order)}
                              >
                                <Calendar size={14} />
                                <span>Turno</span>
                              </button>
                            )}

                          {!order.service_id && !order.service && (
                            <button
                              type="button"
                              className="sales-action-btn sales-action-btn--label"
                              title="Imprimir Etiqueta Térmica de Paquete"
                              onClick={() => setSelectedOrderForLabel(order)}
                            >
                              <Printer size={14} />
                              <span>Etiqueta</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
          title={`Detalle de Venta #${
            selectedOrder.order_number || selectedOrder.id.slice(0, 8)
          }`}
        >
          <div className="order-detail-modal">
            {/* Buyer Info */}
            <div className="order-detail-section">
              <h4 className="order-detail-section__title">Datos del Comprador</h4>
              <div className="order-detail-grid">
                <div>
                  <span className="order-detail-label">Nombre:</span>
                  <span className="order-detail-value">
                    {selectedOrder.buyer?.full_name ||
                      selectedOrder.user?.full_name ||
                      "No disponible"}
                  </span>
                </div>
                <div>
                  <span className="order-detail-label">Email:</span>
                  <span className="order-detail-value">
                    {selectedOrder.buyer?.email ||
                      selectedOrder.user?.email ||
                      "No disponible"}
                  </span>
                </div>
                <div>
                  <span className="order-detail-label">Teléfono:</span>
                  <span className="order-detail-value">
                    {selectedOrder.buyer?.phone ||
                      selectedOrder.user?.phone ||
                      "No informado"}
                  </span>
                </div>
                <div>
                  <span className="order-detail-label">Método de entrega:</span>
                  <span className="order-detail-value">
                    {getDeliveryLabel(selectedOrder.delivery_type)}
                  </span>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div className="order-detail-address">
                  <span className="order-detail-label">Dirección de entrega:</span>
                  <p className="order-detail-address__text">
                    {selectedOrder.shipping_address.street}{" "}
                    {selectedOrder.shipping_address.number},{" "}
                    {selectedOrder.shipping_address.city},{" "}
                    {selectedOrder.shipping_address.state} (CP{" "}
                    {selectedOrder.shipping_address.zip_code})
                  </p>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="order-detail-section">
              <h4 className="order-detail-section__title">Desglose de Pago</h4>
              <div className="order-detail-row">
                <span>Subtotal artículos:</span>
                <span>
                  $
                  {(
                    (selectedOrder.total_amount ?? 0) -
                    (selectedOrder.shipping_cost ?? 0)
                  ).toLocaleString("es-AR")}
                </span>
              </div>
              <div className="order-detail-row">
                <span>Costo de envío:</span>
                <span>
                  ${Number(selectedOrder.shipping_cost ?? 0).toLocaleString("es-AR")}
                </span>
              </div>
              <div className="order-detail-row order-detail-row--total">
                <span>Total:</span>
                <span>
                  ${Number(selectedOrder.total_amount ?? 0).toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {/* Contextual Actions */}
            <div className="order-detail-section">
              <h4 className="order-detail-section__title">Acciones del Pedido</h4>

              {selectedOrder.status === "pending" && (
                <div className="order-actions-group">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={confirmMutation.isPending}
                    onClick={() => confirmMutation.mutate(selectedOrder.id)}
                  >
                    Confirmar pedido
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancelar pedido
                  </button>
                </div>
              )}

              {/* Service Appointment assignment if order has service */}
              {(selectedOrder.service_id || selectedOrder.service) && (
                <div className="order-service-appointment-box">
                  <h5>Turno del Servicio</h5>
                  {selectedOrder.appointment_status === "pending_appointment" ? (
                    <div className="appointment-pending-banner">
                      <div className="appointment-pending-text">
                        <AlertTriangle size={20} className="icon-amber" />
                        <div>
                          <strong>⚠️ Turno Pendiente de Asignación Obligatoria</strong>
                          <p>
                            El cliente espera que le programes la fecha y hora de atención para este servicio.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setSelectedOrderForAppointment(selectedOrder)}
                      >
                        <Calendar size={15} />
                        <span>Asignar Turno al Cliente</span>
                      </button>
                    </div>
                  ) : selectedOrder.appointment ? (
                    <div className="appointment-scheduled-banner">
                      <CheckCircle2 size={20} className="icon-green" />
                      <div className="appointment-scheduled-details">
                        <strong>Turno Programado: {selectedOrder.appointment.appointment_date} a las {selectedOrder.appointment.appointment_time} hs</strong>
                        {selectedOrder.appointment.notes && (
                          <p className="appointment-notes">Indicaciones: {selectedOrder.appointment.notes}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSelectedOrderForAppointment(selectedOrder)}
                      >
                        Reprogramar
                      </button>
                    </div>
                  ) : (
                    <div className="appointment-pending-banner">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSelectedOrderForAppointment(selectedOrder)}
                      >
                        <Calendar size={15} />
                        <span>Gestionar Turno</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Thermal Label Print button for product orders */}
              {!selectedOrder.service_id && !selectedOrder.service && (
                <div className="order-print-label-row">
                  <button
                    type="button"
                    className="btn-secondary order-print-label-btn"
                    onClick={() => setSelectedOrderForLabel(selectedOrder)}
                  >
                    <Printer size={16} />
                    <span>🖨️ Imprimir Etiqueta de Paquete (Térmica 80mm / Bluetooth POS)</span>
                  </button>
                </div>
              )}

              {selectedOrder.status === "confirmed" && (
                <div className="order-actions-group">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={preparingMutation.isPending}
                    onClick={() => preparingMutation.mutate(selectedOrder.id)}
                  >
                    Marcar en preparación
                  </button>
                </div>
              )}

              {selectedOrder.status === "preparing" && (
                <div className="order-actions-group">
                  {selectedOrder.delivery_type === "pickup" ? (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={readyMutation.isPending}
                      onClick={() => readyMutation.mutate(selectedOrder.id)}
                    >
                      Marcar listo para retiro en sucursal
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={readyMutation.isPending}
                      onClick={() => readyMutation.mutate(selectedOrder.id)}
                    >
                      Marcar listo para despacho
                    </button>
                  )}
                </div>
              )}

              {/* Pickup Verification */}
              {selectedOrder.delivery_type === "pickup" && (
                <div className="pickup-verify-box">
                  <h5>Validar Entrega en Sucursal</h5>
                  <p>
                    Ingresá el código de 7 caracteres numéricos o escaneá el QR
                    presentado por el cliente.
                  </p>
                  <div className="pickup-verify-input-group">
                    <input
                      type="text"
                      maxLength={7}
                      placeholder="Ej: 8492015"
                      value={pickupCode}
                      onChange={(e) => setPickupCode(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={pickupCode.length !== 7 || pickupVerifyMutation.isPending}
                      onClick={() =>
                        pickupVerifyMutation.mutate({
                          id: selectedOrder.id,
                          code: pickupCode,
                        })
                      }
                    >
                      Validar y completar
                    </button>
                  </div>
                </div>
              )}

              {/* Local shipment image / dispatch */}
              {selectedOrder.delivery_type === "shipment" && (
                <div className="shipment-dispatch-box">
                  <h5>Despacho por Rider / Flete</h5>
                  <label>Foto previa del paquete (URL o comprobante):</label>
                  <div className="pickup-verify-input-group">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={packageImageUrl}
                      onChange={(e) => setPackageImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={!packageImageUrl}
                      onClick={() => {
                        commerceService
                          .uploadShipmentImage(selectedOrder.id, packageImageUrl)
                          .then(() => showSuccess("Foto del paquete guardada."))
                          .catch(() => showError("No se pudo guardar la foto."));
                      }}
                    >
                      Subir foto
                    </button>
                  </div>
                </div>
              )}

              {/* WhatsApp direct contact if buyer has phone */}
              {(selectedOrder.buyer?.phone || selectedOrder.user?.phone) && (
                <div className="whatsapp-contact-box">
                  <a
                    href={`https://wa.me/${(selectedOrder.buyer?.phone || selectedOrder.user?.phone)?.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="whatsapp-btn"
                  >
                    <MessageCircle size={18} />
                    <span>Contactar al cliente por WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Long distance transport guide */}
              <div className="transport-guide-box">
                <h5>Transporte Larga Distancia / Encomienda</h5>
                <div className="transport-guide-fields">
                  <input
                    type="text"
                    placeholder="Empresa de transporte (ej: Andreani, Vía Cargo)"
                    value={transportCarrier}
                    onChange={(e) => setTransportCarrier(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Número de guía / remito"
                    value={transportTrackingNumber}
                    onChange={(e) => setTransportTrackingNumber(e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="URL de seguimiento externo"
                    value={transportTrackingUrl}
                    onChange={(e) => setTransportTrackingUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={!transportCarrier || !transportTrackingNumber}
                    onClick={() =>
                      transportMutation.mutate({
                        id: selectedOrder.id,
                        carrier_name: transportCarrier,
                        tracking_number: transportTrackingNumber,
                        tracking_url: transportTrackingUrl,
                      })
                    }
                  >
                    Guardar guía de transporte
                  </button>
                </div>
              </div>

              {/* Invoice section */}
              <div className="invoice-box">
                <h5>Comprobante de Factura</h5>
                <p>
                  Estado actual:{" "}
                  <strong>
                    {selectedOrder.invoice_url ? "Emitida" : "No emitida"}
                  </strong>
                </p>
                {selectedOrder.invoice_url && (
                  <a
                    href={selectedOrder.invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="invoice-download-link"
                  >
                    <ExternalLink size={16} /> Ver factura actual
                  </a>
                )}
                <div className="pickup-verify-input-group">
                  <input
                    type="url"
                    placeholder="Enlace o PDF de la factura..."
                    value={invoiceUrlInput}
                    onChange={(e) => setInvoiceUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={!invoiceUrlInput || invoiceMutation.isPending}
                    onClick={() =>
                      invoiceMutation.mutate({
                        id: selectedOrder.id,
                        url: invoiceUrlInput,
                      })
                    }
                  >
                    Cargar factura
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && selectedOrder && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancelar Pedido"
        >
          <div className="cancel-order-modal">
            <div className="cancel-penalty-alert" role="alert">
              <AlertTriangle size={24} className="cancel-penalty-alert__icon" />
              <div className="cancel-penalty-alert__content">
                <strong>Penalización en tu Reputación</strong>
                <p>
                  Atención: Cancelar este pedido afectará negativamente tu puntuación
                  de reputación <strong>(-20 pts)</strong> y tu visibilidad en el
                  catálogo. ¿Deseas continuar?
                </p>
              </div>
            </div>

            <p>
              ¿Estás seguro de que deseás cancelar este pedido? Esta acción no se
              puede deshacer.
            </p>
            <label className="order-detail-label">Motivo de cancelación:</label>
            <textarea
              className="cancel-textarea"
              rows={3}
              placeholder="Indica el motivo al cliente (ej: falta de stock, dirección inaccesible)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCancelModalOpen(false)}
              >
                Volver
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={cancelMutation.isPending}
                onClick={() =>
                  cancelMutation.mutate({
                    id: selectedOrder.id,
                    reason: cancelReason,
                  })
                }
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Service Appointment Modal */}
      {selectedOrderForAppointment && (
        <AssignServiceAppointmentModal
          order={selectedOrderForAppointment}
          isOpen={Boolean(selectedOrderForAppointment)}
          onClose={() => setSelectedOrderForAppointment(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
            refetch();
          }}
        />
      )}

      {/* Package Thermal Label Modal */}
      {selectedOrderForLabel && (
        <PackageThermalLabelModal
          order={selectedOrderForLabel}
          isOpen={Boolean(selectedOrderForLabel)}
          onClose={() => setSelectedOrderForLabel(null)}
        />
      )}
    </div>
  );
}
