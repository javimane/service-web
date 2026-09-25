"use client";

import React, { useState, useEffect } from "react";
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
  Store,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  commerceService,
  OrderSummary,
  OrderStatus,
  PageResponse,
  Branch,
} from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import Pagination from "@/components/Pagination/Pagination";
import Modal from "@/components/Modal/Modal";
import { useAlert } from "@/context/AlertContext";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import { getProfessionalMeAction } from "@/app/actions/professionals";
import AssignServiceAppointmentModal from "./AssignServiceAppointmentModal";
import PackageThermalLabelModal from "./PackageThermalLabelModal";
import ServiceOrderVoucherModal from "./ServiceOrderVoucherModal";
import BatchOrderTicketsModal from "./BatchOrderTicketsModal";
import DateRangeFilter, { DateRangeValue, toUtcDateRange } from "./DateRangeFilter";
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
  const token = getAccessToken();
  setApiAccessToken(token);
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();
  const { showSuccess, showError } = useAlert();

  const professionalId = sessionStatus?.subscription?.professional_id ?? sessionStatus?.professional_id;
  const { data: professional } = useQuery({
    queryKey: ["professional-me", professionalId],
    queryFn: async () => (await getProfessionalMeAction({ token: await getAccessToken() }))?.data ?? null,
    enabled: Boolean(professionalId),
    staleTime: 1000 * 60 * 5,
  });
  const companyData = professional?.companies ?? professional?.Company;
  const company = Array.isArray(companyData) ? companyData[0] : companyData;
  const companyId = Number(company?.id ?? sessionStatus?.company_id) || undefined;

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ field: "sale", from: "", to: "" });
  const [isAutoPrintActive, setIsAutoPrintActive] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrdersForBatchPrint, setSelectedOrdersForBatchPrint] = useState<OrderSummary[]>([]);
  const [batchPrintModalOpen, setBatchPrintModalOpen] = useState(false);

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
  const [selectedOrderForServiceVoucher, setSelectedOrderForServiceVoucher] = useState<OrderSummary | null>(null);

  // Fetch branches
  const { data: rawBranches, isError: branchesError } = useQuery({
    queryKey: ["merchant-branches", companyId],
    queryFn: () => commerceService.branches(companyId!),
    enabled: Boolean(companyId),
  });

  const branches: Branch[] = React.useMemo(() => Array.isArray(rawBranches)
    ? rawBranches
    : Array.isArray((rawBranches as any)?.data)
      ? (rawBranches as any).data
      : Array.isArray((rawBranches as any)?.items)
        ? (rawBranches as any).items
        : [], [rawBranches]);

  // Restore active branch and auto-print preference from localStorage
  useEffect(() => {
    try {
      const savedBranch = localStorage.getItem("sercio_sales_branch_id");
      if (savedBranch) {
        setSelectedBranchId(savedBranch);
      }
      const savedAutoPrint = localStorage.getItem("sercio_autoprint_active");
      if (savedAutoPrint !== null) {
        setIsAutoPrintActive(savedAutoPrint === "true");
      }
    } catch {
      // ignore storage error
    }
  }, []);

  useEffect(() => {
    if (rawBranches === undefined || !selectedBranchId) return;
    if (branches.some((branch) => branch.id === selectedBranchId)) return;
    setSelectedBranchId("");
    setPage(1);
    try {
      localStorage.removeItem("sercio_sales_branch_id");
    } catch {
      // El filtro en memoria también se limpia si el almacenamiento no está disponible.
    }
  }, [rawBranches, branches, selectedBranchId]);

  const { data: ordersData, isLoading, isError, error, refetch } = useQuery<PageResponse<OrderSummary>>({
    queryKey: ["merchant-orders", page, statusFilter, selectedBranchId, dateRange],
    queryFn: () =>
      commerceService.merchantOrders(
        page,
        10,
        statusFilter || undefined,
        selectedBranchId || undefined,
        {
          [`${dateRange.field}_date_from`]: toUtcDateRange(dateRange).from,
          [`${dateRange.field}_date_to`]: toUtcDateRange(dateRange).to,
        }
      ),
    refetchInterval: isAutoPrintActive ? 10000 : false,
    enabled: (!dateRange.from || !dateRange.to || dateRange.from <= dateRange.to) &&
      (!selectedBranchId || branchesError || (rawBranches !== undefined && branches.some((branch) => branch.id === selectedBranchId))),
  });
  const ordersRouteMissing = (error as { response?: { status?: number } } | null)?.response?.status === 404;
  const waitingForBranches = Boolean(selectedBranchId) && rawBranches === undefined && !branchesError;

  const orders = React.useMemo(
    () => ordersData?.items ?? ordersData?.data ?? [],
    [ordersData]
  );
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

  const updateBranchAutoPrintMutation = useMutation({
    mutationFn: ({
      branchId,
      auto_print_tickets,
    }: {
      branchId: string;
      auto_print_tickets: boolean;
    }) => commerceService.updateBranch(branchId, { auto_print_tickets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-branches"] });
    },
  });

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setPage(1);
    try {
      localStorage.setItem("sercio_sales_branch_id", branchId);
    } catch {
      // ignore
    }

    if (branchId) {
      const found = branches.find((b) => b.id === branchId);
      if (found && typeof found.auto_print_tickets === "boolean") {
        setIsAutoPrintActive(found.auto_print_tickets);
        try {
          localStorage.setItem("sercio_autoprint_active", String(found.auto_print_tickets));
        } catch {
          // ignore
        }
      }
    }
  };

  const toggleAutoPrint = () => {
    const nextVal = !isAutoPrintActive;
    setIsAutoPrintActive(nextVal);
    try {
      localStorage.setItem("sercio_autoprint_active", String(nextVal));
    } catch {
      // ignore
    }

    if (selectedBranchId) {
      updateBranchAutoPrintMutation.mutate({
        branchId: selectedBranchId,
        auto_print_tickets: nextVal,
      });
    }

    if (nextVal) {
      showSuccess(
        selectedBranchId
          ? "Impresión automática activada para la sucursal seleccionada."
          : "Impresión automática activada para órdenes entrantes."
      );
    } else {
      showSuccess("Impresión automática pausada.");
    }
  };

  const toggleSelectAll = () => {
    if (orders.length === 0) return;
    const allVisibleSelected = orders.every((o) => selectedOrderIds.includes(o.id));
    if (allVisibleSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !orders.some((o) => o.id === id)));
    } else {
      const newIds = new Set([...selectedOrderIds, ...orders.map((o) => o.id)]);
      setSelectedOrderIds(Array.from(newIds));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleOpenBatchPrint = () => {
    const selectedList = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (selectedList.length === 0) {
      showError("Selecciona al menos una venta para imprimir.");
      return;
    }
    setSelectedOrdersForBatchPrint(selectedList);
    setBatchPrintModalOpen(true);
  };

  // Auto-print effect when new unprinted orders arrive
  useEffect(() => {
    if (!isAutoPrintActive || orders.length === 0) return;

    const unprinted = orders.filter((o) => {
      if (o.status === "cancelled") return false;
      if (selectedBranchId) {
        const orderLocation = o.branch_id ||
          (o.origin_address_id ? `main:${companyId}` : "");
        if (orderLocation !== selectedBranchId) return false;
      }
      try {
        return !localStorage.getItem(`sercio_printed_ticket_${o.id}`);
      } catch {
        return false;
      }
    });

    if (unprinted.length > 0) {
      setSelectedOrdersForBatchPrint(unprinted);
      setBatchPrintModalOpen(true);
      showSuccess(`¡Venta entrante! Preparando ticket de ${unprinted.length} orden(es)...`);
    }
  }, [orders, isAutoPrintActive, selectedBranchId, companyId, showSuccess]);

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

      {/* Branch & Auto-print Toolbar */}
      <div className="sales-branch-toolbar">
        <div className="sales-branch-control">
          <div className="sales-branch-control__icon">
            <Store size={20} />
          </div>
          <label htmlFor="sales-branch-select" className="sales-branch-control__label">
            Sucursal de este puesto:
          </label>
          <select
            id="sales-branch-select"
            className="sales-branch-select"
            value={selectedBranchId}
            onChange={(e) => handleBranchChange(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.street_name ? `(${b.street_name} ${b.street_number || ""})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="sales-autoprint-control">
          <button
            type="button"
            className={`sales-autoprint-toggle-btn ${
              isAutoPrintActive ? "sales-autoprint-toggle-btn--active" : ""
            }`}
            onClick={toggleAutoPrint}
            title={
              isAutoPrintActive
                ? "Click para pausar la impresión automática de tickets"
                : "Click para activar la impresión automática de tickets al ingresar ventas"
            }
          >
            <Printer size={16} />
            <span>
              {isAutoPrintActive
                ? "Impresión automática: ACTIVADA"
                : "Impresión automática: DESACTIVADA"}
            </span>
            {isAutoPrintActive ? (
              <ToggleRight size={22} />
            ) : (
              <ToggleLeft size={22} />
            )}
          </button>
          <span className="sales-autoprint-hint">
            {isAutoPrintActive
              ? "🟢 Detectando e imprimiendo tickets automáticamente."
              : "⚪ Impresión manual individual o por lote."}
          </span>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="sales-batch-bar">
          <div className="sales-batch-bar__info">
            <CheckSquare size={18} />
            <span>
              <strong>{selectedOrderIds.length}</strong>{" "}
              {selectedOrderIds.length === 1
                ? "venta seleccionada"
                : "ventas seleccionadas"}
            </span>
          </div>
          <div className="sales-batch-bar__actions">
            <button
              type="button"
              className="sales-batch-bar__print-btn"
              onClick={handleOpenBatchPrint}
            >
              <Printer size={16} />
              <span>Imprimir tickets seleccionados ({selectedOrderIds.length})</span>
            </button>
            <button
              type="button"
              className="btn-secondary sales-batch-bar__clear-btn"
              onClick={() => setSelectedOrderIds([])}
            >
              Deseleccionar todas
            </button>
          </div>
        </div>
      )}

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

      <DateRangeFilter
        label="Filtrar ventas por fecha"
        options={[
          { value: "sale", label: "venta" },
          { value: "paid", label: "pago" },
          { value: "delivered", label: "entrega" },
        ]}
        value={dateRange}
        onChange={(value) => { setDateRange(value); setPage(1); }}
      />

      {/* Content Table / States */}
      {dateRange.from && dateRange.to && dateRange.from > dateRange.to ? null : isLoading || waitingForBranches ? (
        <div className="sales-state sales-state--loading">
          <Clock className="sales-state__spinner" size={32} />
          <p>Cargando ventas...</p>
        </div>
      ) : isError ? (
        <div className="sales-state sales-state--error">
          <AlertCircle size={32} />
          <p>{ordersRouteMissing
            ? "La ruta de ventas no está disponible en la API. Es necesario actualizar o reiniciar la API."
            : "Hubo un error al cargar las ventas."}</p>
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="sales-state sales-state--empty">
          <PackageCheck size={48} />
          <h3>{statusFilter || selectedBranchId || dateRange.from || dateRange.to ? "No hay ventas para este filtro" : "Todavía no tenés ventas"}</h3>
          <p>{statusFilter || selectedBranchId || dateRange.from || dateRange.to
            ? "Probá con otro estado, sucursal o período."
            : "Cuando recibas un pedido, aparecerá acá."}</p>
        </div>
      ) : (
        <div className="sales-table-card">
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th className="sales-table__col-check">
                    <input
                      type="checkbox"
                      className="sales-checkbox"
                      checked={
                        orders.length > 0 &&
                        orders.every((o) => selectedOrderIds.includes(o.id))
                      }
                      onChange={toggleSelectAll}
                      aria-label="Seleccionar todas las ventas visibles"
                    />
                  </th>
                  <th>Orden</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Artículo / Productos</th>
                  <th>Sucursal</th>
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
                      <td className="sales-table__cell-check">
                        <input
                          type="checkbox"
                          className="sales-checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          aria-label={`Seleccionar orden ${order.id}`}
                        />
                      </td>
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
                      <td>
                        <span className="sales-table__branch-tag">
                          {order.branch?.name || (order.branch_id ? "Sucursal asignada" : "Sucursal Principal")}
                        </span>
                      </td>
                      <td>
                        {getDeliveryLabel(order.delivery_type)}
                        {order.scheduled_delivery_date && (
                          <span className="sales-table__schedule">Programado: {order.scheduled_delivery_date.split("-").reverse().join("/")}</span>
                        )}
                      </td>
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

                          {(order.service_id || order.service) && (
                            <button
                              type="button"
                              className="sales-action-btn sales-action-btn--label"
                              title="Imprimir Ficha y Comprobante de Servicio"
                              onClick={() => setSelectedOrderForServiceVoucher(order)}
                            >
                              <Printer size={14} />
                              <span>Ficha</span>
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
                      selectedOrder.buyer?.phone_number ||
                      selectedOrder.user?.phone ||
                      selectedOrder.user?.phone_number ||
                      "No informado"}
                  </span>
                </div>
                <div>
                  <span className="order-detail-label">Método de entrega:</span>
                  <span className="order-detail-value">
                    {getDeliveryLabel(selectedOrder.delivery_type)}
                  </span>
                </div>
                {selectedOrder.scheduled_delivery_date && (
                  <div>
                    <span className="order-detail-label">Envío programado:</span>
                    <span className="order-detail-value">{selectedOrder.scheduled_delivery_date.split("-").reverse().join("/")}</span>
                  </div>
                )}
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

            {/* Billing Data Info for Invoice */}
            <div className="order-detail-section">
              <h4 className="order-detail-section__title">
                Datos de Facturación para Factura
              </h4>
              {selectedOrder.billing_data || selectedOrder.billing_profile ? (
                (() => {
                  const bd =
                    selectedOrder.billing_data || selectedOrder.billing_profile;
                  const isRespInscripto =
                    bd.tax_condition === "responsable_inscripto";
                  return (
                    <div className="order-detail-grid">
                      <div>
                        <span className="order-detail-label">Nombre / Razón Social:</span>
                        <span className="order-detail-value">
                          {bd.company_name || bd.full_name}
                        </span>
                      </div>
                      <div>
                        <span className="order-detail-label">Titular:</span>
                        <span className="order-detail-value">{bd.full_name}</span>
                      </div>
                      <div>
                        <span className="order-detail-label">CUIT / CUIL:</span>
                        <span className="order-detail-value order-detail-value--cuit">
                          {bd.cuit}
                        </span>
                      </div>
                      <div>
                        <span className="order-detail-label">Condición frente al IVA:</span>
                        <span className="order-detail-value">
                          <span
                            className={`sales-billing-badge ${
                              isRespInscripto
                                ? "sales-billing-badge--company"
                                : "sales-billing-badge--final"
                            }`}
                          >
                            {isRespInscripto
                              ? "Responsable Inscripto (Factura A)"
                              : "Consumidor Final (Factura B)"}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="sales-billing-empty">
                  <p>
                    El comprador no registró CUIT específico. Emitir como{" "}
                    <strong>Consumidor Final (Factura B)</strong> a nombre de:{" "}
                    <strong>
                      {selectedOrder.buyer?.full_name ||
                        selectedOrder.user?.full_name ||
                        "Consumidor Final"}
                    </strong>
                    .
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
                  <button data-action-tone="cancel"
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

              {/* Service Voucher Print button for service orders */}
              {(selectedOrder.service_id || selectedOrder.service) && (
                <div className="order-print-label-row">
                  <button
                    type="button"
                    className="btn-secondary order-print-label-btn"
                    onClick={() => setSelectedOrderForServiceVoucher(selectedOrder)}
                  >
                    <Printer size={16} />
                    <span>🖨️ Imprimir Ficha de Servicio (con Domicilio y Teléfono)</span>
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
                    <button data-action-tone="upload"
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
              {(selectedOrder.buyer?.phone ||
                selectedOrder.buyer?.phone_number ||
                selectedOrder.user?.phone ||
                selectedOrder.user?.phone_number) && (
                <div className="whatsapp-contact-box">
                  <a
                    href={`https://wa.me/${(selectedOrder.buyer?.phone || selectedOrder.buyer?.phone_number || selectedOrder.user?.phone || selectedOrder.user?.phone_number)?.replace(/\D/g, "")}`}
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

      {/* Service Order Voucher Modal */}
      {selectedOrderForServiceVoucher && (
        <ServiceOrderVoucherModal
          order={selectedOrderForServiceVoucher}
          isOpen={Boolean(selectedOrderForServiceVoucher)}
          onClose={() => setSelectedOrderForServiceVoucher(null)}
        />
      )}

      {/* Batch Order Tickets Modal */}
      {batchPrintModalOpen && selectedOrdersForBatchPrint.length > 0 && (
        <BatchOrderTicketsModal
          isOpen={batchPrintModalOpen}
          onClose={() => {
            setBatchPrintModalOpen(false);
            setSelectedOrdersForBatchPrint([]);
          }}
          orders={selectedOrdersForBatchPrint}
          branchName={
            branches.find((b) => b.id === selectedBranchId)?.name ||
            "Sucursal Principal"
          }
          onPrinted={(printedIds) => {
            setSelectedOrderIds((prev) =>
              prev.filter((id) => !printedIds.includes(id))
            );
          }}
        />
      )}
    </div>
  );
}
