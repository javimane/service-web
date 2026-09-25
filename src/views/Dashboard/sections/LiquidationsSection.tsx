"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Eye,
  Download,
  FileClock,
  X,
} from "lucide-react";
import {
  commerceService,
  Liquidation,
  PageResponse,
  Branch,
  GeneratedReportNotification,
  LiquidationsReportType,
} from "@/services/commerceService";
import Pagination from "@/components/Pagination/Pagination";
import Modal from "@/components/Modal/Modal";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { getProfessionalMeAction } from "@/app/actions/professionals";
import DateRangeFilter, { DateRangeValue, toUtcDateRange } from "./DateRangeFilter";
import { localDateInputValue } from "@/utils/localDateRange";
import "./LiquidationsSection.css";

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todos los estados", value: "" },
  { label: "Disponible", value: "available" },
  { label: "En proceso", value: "in_process" },
  { label: "Liquidado", value: "settled" },
  { label: "Retenido", value: "withheld" },
];

export default function LiquidationsSection() {
  const { sessionStatus } = useAuth();
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
  const token = getAccessToken();
  setApiAccessToken(token);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [listBranchId, setListBranchId] = useState("");
  const [listDateRange, setListDateRange] = useState<DateRangeValue>({ field: "date", from: "", to: "" });
  const [selectedLiquidation, setSelectedLiquidation] = useState<Liquidation | null>(null);
  const [reportType, setReportType] = useState<LiquidationsReportType>("full");
  const [dateFrom, setDateFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(() => localDateInputValue(new Date()));
  const [includeTaxes, setIncludeTaxes] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [reportRequested, setReportRequested] = useState(false);

  const {
    data: liquidationsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PageResponse<Liquidation>>({
    queryKey: ["merchant-liquidations", page, statusFilter, listBranchId, listDateRange],
    queryFn: () => commerceService.liquidations(page, 10, statusFilter || undefined, listBranchId || undefined, {
      [`${listDateRange.field}_from`]: toUtcDateRange(listDateRange).from,
      [`${listDateRange.field}_to`]: toUtcDateRange(listDateRange).to,
    }),
    enabled: !listDateRange.from || !listDateRange.to || listDateRange.from <= listDateRange.to,
  });

  const liquidations = liquidationsData?.items ?? liquidationsData?.data ?? [];
  const total = liquidationsData?.total ?? liquidations.length;
  const totalPages = liquidationsData?.totalPages ?? (Math.ceil(total / 10) || 1);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["report-branches", companyId],
    queryFn: () => commerceService.branches(companyId!),
    enabled: Boolean(companyId),
  });

  const {
    data: notifications = [],
    refetch: refetchReports,
  } = useQuery<GeneratedReportNotification[]>({
    queryKey: ["generated-liquidation-reports"],
    queryFn: () => commerceService.getGeneratedReports(),
    enabled: reportsModalOpen,
    refetchInterval: reportsModalOpen && reportRequested ? 8_000 : false,
  });

  const generatedReports = notifications.filter(
    (notification) => notification.type === "report_ready",
  );

  const reportMutation = useMutation({
    mutationFn: () => commerceService.requestLiquidationsReport({
      reportType,
      dateFrom,
      dateTo,
      includeTaxes,
      branchId: branchId || undefined,
      language: "es",
    }),
    onSuccess: async (response) => {
      if (!response.queued) throw new Error(response.message);
      setReportRequested(true);
      setReportsModalOpen(true);
      await refetchReports();
    },
  });

  const handleGenerateReport = () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;
    reportMutation.mutate();
  };

  // Header Metrics Calculations
  const availableBalance = liquidations
    .filter((l) => l.status === "available")
    .reduce((acc, curr) => acc + (curr.net_amount ?? curr.amount ?? 0), 0);

  const pendingReleaseBalance = liquidations
    .filter((l) => l.status === "pending" || l.status === "in_process")
    .reduce((acc, curr) => acc + (curr.net_amount ?? curr.amount ?? 0), 0);

  const historicalSettled = liquidations
    .filter((l) => l.status === "settled")
    .reduce((acc, curr) => acc + (curr.net_amount ?? curr.amount ?? 0), 0);

  // Next automatic liquidation estimation (e.g. next Friday or end of month)
  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(nextPayoutDate.getDate() + ((5 - nextPayoutDate.getDay() + 7) % 7 || 7));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="liq-badge liq-badge--available">Disponible</span>
        );
      case "in_process":
      case "pending":
        return (
          <span className="liq-badge liq-badge--process">En proceso</span>
        );
      case "settled":
        return (
          <span className="liq-badge liq-badge--settled">Liquidado</span>
        );
      case "withheld":
        return (
          <span className="liq-badge liq-badge--withheld">Retenido</span>
        );
      default:
        return <span className="liq-badge">{status}</span>;
    }
  };

  return (
    <div className="liquidations-section">
      <header className="liquidations-section__header">
        <div>
          <span className="liquidations-section__subtitle">Gestión Comercial</span>
          <h1 className="liquidations-section__title">Liquidaciones y Cobros</h1>
        </div>
      </header>

      {/* Main Metrics */}
      <div className="liquidations-metrics">
        <div className="liquidations-card">
          <div className="liquidations-card__icon liquidations-card__icon--green">
            <DollarSign size={20} />
          </div>
          <div className="liquidations-card__info">
            <span className="liquidations-card__label">SALDO DISPONIBLE</span>
            <span className="liquidations-card__value">
              ${availableBalance.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        <div className="liquidations-card">
          <div className="liquidations-card__icon liquidations-card__icon--amber">
            <Clock size={20} />
          </div>
          <div className="liquidations-card__info">
            <span className="liquidations-card__label">SALDO A LIBERAR</span>
            <span className="liquidations-card__value">
              ${pendingReleaseBalance.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        <div className="liquidations-card">
          <div className="liquidations-card__icon liquidations-card__icon--blue">
            <ShieldCheck size={20} />
          </div>
          <div className="liquidations-card__info">
            <span className="liquidations-card__label">HISTÓRICO LIQUIDADO</span>
            <span className="liquidations-card__value">
              ${historicalSettled.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        <div className="liquidations-card">
          <div className="liquidations-card__icon liquidations-card__icon--teal">
            <Calendar size={20} />
          </div>
          <div className="liquidations-card__info">
            <span className="liquidations-card__label">PRÓXIMA LIQUIDACIÓN</span>
            <span className="liquidations-card__value liquidations-card__value--date">
              {nextPayoutDate.toLocaleDateString("es-AR")}
            </span>
          </div>
        </div>
      </div>

      <section className="liquidations-report-panel" aria-labelledby="liquidations-report-title">
        <div className="liquidations-report-panel__heading">
          <div>
            <span className="liquidations-report-panel__eyebrow">Reportes contables</span>
            <h2 id="liquidations-report-title">Exportá el período que necesitás</h2>
          </div>
          <button
            type="button"
            className="liquidations-report-panel__history-btn"
            onClick={() => setReportsModalOpen(true)}
          >
            <FileClock size={17} /> Mis reportes
          </button>
        </div>

        <div className="liquidations-report-panel__fields">
          <label className="liquidations-report-panel__field">
            <span>Desde</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="liquidations-report-panel__field">
            <span>Hasta</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label className="liquidations-report-panel__field">
            <span>Contenido</span>
            <select value={reportType} onChange={(event) => setReportType(event.target.value as LiquidationsReportType)}>
              <option value="settlement">Solo liquidaciones</option>
              <option value="sale">Solo ventas</option>
              <option value="full">Ventas y liquidaciones</option>
            </select>
          </label>
          <label className="liquidations-report-panel__field">
            <span>Sucursal</span>
            <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
              <option value="">Todas las sucursales</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <label className="liquidations-report-panel__taxes">
            <input type="checkbox" checked={includeTaxes} onChange={(event) => setIncludeTaxes(event.target.checked)} />
            <span>Incluir impuestos y retenciones</span>
          </label>
          <button
            type="button"
            className="liquidations-report-panel__generate-btn"
            disabled={reportMutation.isPending || !dateFrom || !dateTo || dateFrom > dateTo}
            onClick={handleGenerateReport}
          >
            <FileText size={17} />
            {reportMutation.isPending ? "Enviando..." : "Generar reporte"}
          </button>
        </div>
        {dateFrom > dateTo && <p className="liquidations-report-panel__error">La fecha final debe ser posterior a la fecha inicial.</p>}
        {reportMutation.isError && <p className="liquidations-report-panel__error">{reportMutation.error.message || "No se pudo preparar el reporte."}</p>}
      </section>

      {/* Filter Tabs */}
      <div className="liquidations-filters">
        <label className="liquidations-branch-filter">
          <span>Sucursal</span>
          <select value={listBranchId} onChange={(event) => { setListBranchId(event.target.value); setPage(1); }}>
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`liquidations-filter-btn ${
              statusFilter === f.value ? "liquidations-filter-btn--active" : ""
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
        label="Filtrar liquidaciones por fecha"
        options={[
          { value: "date", label: "liquidación" },
          { value: "paid", label: "acreditación" },
          { value: "scheduled", label: "liberación prevista" },
        ]}
        value={listDateRange}
        onChange={(value) => { setListDateRange(value); setPage(1); }}
      />

      {/* Content / States */}
      {listDateRange.from && listDateRange.to && listDateRange.from > listDateRange.to ? null : isLoading ? (
        <div className="liquidations-state liquidations-state--loading">
          <Clock className="liquidations-state__spinner" size={32} />
          <p>Cargando liquidaciones...</p>
        </div>
      ) : isError ? (
        <div className="liquidations-state liquidations-state--error">
          <AlertCircle size={32} />
          <p>Hubo un error al obtener las liquidaciones.</p>
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : liquidations.length === 0 ? (
        <div className="liquidations-state liquidations-state--empty">
          <FileText size={48} />
          <h3>{statusFilter || listBranchId || listDateRange.from || listDateRange.to ? "No hay liquidaciones para este filtro" : "No hay liquidaciones registradas"}</h3>
          <p>{statusFilter || listBranchId || listDateRange.from || listDateRange.to ? "Probá con otro estado, sucursal o período." : "Tus ventas aparecerán aquí a medida que se cumplan los plazos de liberación."}</p>
        </div>
      ) : (
        <div className="liquidations-table-card">
          <div className="liquidations-table-wrap">
            <table className="liquidations-table">
              <thead>
                <tr>
                  <th>ID Liquidación</th>
                  <th>Fecha de corte</th>
                  <th>Monto Bruto</th>
                  <th>Comisión Sercio</th>
                  <th>Retenciones</th>
                  <th>Monto Neto</th>
                  <th>Estado</th>
                  <th>Fecha Acreditación</th>
                  <th>Comprobante</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {liquidations.map((liq) => {
                  const gross = liq.amount ?? 0;
                  const fee = liq.platform_fee ?? gross * 0.1;
                  const tax = liq.tax_withholding ?? 0;
                  const net = liq.net_amount ?? (gross - fee - tax);

                  return (
                    <tr key={liq.id}>
                      <td className="liquidations-table__id">
                        #{liq.id.slice(0, 8)}
                      </td>
                      <td>
                        {liq.cutoff_date
                          ? new Date(liq.cutoff_date).toLocaleDateString("es-AR")
                          : new Date(liq.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td>${gross.toLocaleString("es-AR")}</td>
                      <td className="liquidations-table__deduction">
                        -${fee.toLocaleString("es-AR")}
                      </td>
                      <td className="liquidations-table__deduction">
                        ${tax > 0 ? `-${tax.toLocaleString("es-AR")}` : "0"}
                      </td>
                      <td className="liquidations-table__net">
                        ${net.toLocaleString("es-AR")}
                      </td>
                      <td>{getStatusBadge(liq.status)}</td>
                      <td>
                        {liq.paid_to_merchant_at
                          ? new Date(liq.paid_to_merchant_at).toLocaleDateString("es-AR")
                          : liq.scheduled_release_at
                          ? `Est. ${new Date(liq.scheduled_release_at).toLocaleDateString("es-AR")}`
                          : "Pendiente"}
                      </td>
                      <td>
                        {liq.receipt_url ? (
                          <a
                            href={liq.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="receipt-download-link"
                          >
                            <ExternalLink size={14} /> Descargar
                          </a>
                        ) : (
                          <span className="receipt-unavailable">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="liquidations-action-btn"
                          onClick={() => setSelectedLiquidation(liq)}
                        >
                          <Eye size={14} />
                          <span>Ver</span>
                        </button>
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

      {/* Liquidation Detail Modal */}
      {selectedLiquidation && (
        <Modal
          isOpen={Boolean(selectedLiquidation)}
          onClose={() => setSelectedLiquidation(null)}
          title={`Detalle de Liquidación #${selectedLiquidation.id.slice(0, 8)}`}
        >
          <div className="liquidation-detail-modal">
            <div className="liq-detail-row">
              <span>Estado:</span>
              <span>{getStatusBadge(selectedLiquidation.status)}</span>
            </div>
            <div className="liq-detail-row">
              <span>Monto bruto acumulado:</span>
              <span>${Number(selectedLiquidation.amount ?? 0).toLocaleString("es-AR")}</span>
            </div>
            <div className="liq-detail-row">
              <span>Comisión de plataforma (Sercio):</span>
              <span className="liq-detail-deduction">
                -$
                {Number(
                  selectedLiquidation.platform_fee ??
                    (selectedLiquidation.amount ?? 0) * 0.1
                ).toLocaleString("es-AR")}
              </span>
            </div>
            <div className="liq-detail-row">
              <span>Retenciones impositivas (ARCA/IIBB):</span>
              <span className="liq-detail-deduction">
                -$
                {Number(selectedLiquidation.tax_withholding ?? 0).toLocaleString(
                  "es-AR"
                )}
              </span>
            </div>
            <div className="liq-detail-row liq-detail-row--total">
              <span>Neto a percibir:</span>
              <span>
                $
                {Number(
                  selectedLiquidation.net_amount ??
                    (selectedLiquidation.amount ?? 0)
                ).toLocaleString("es-AR")}
              </span>
            </div>

            <div className="liq-detail-orders-section">
              <h4>Órdenes asociadas</h4>
              {selectedLiquidation.orders && selectedLiquidation.orders.length > 0 ? (
                <div className="liq-orders-list">
                  {selectedLiquidation.orders.map((o) => (
                    <div key={o.id} className="liq-order-item">
                      <div>
                        <strong>#{o.order_number || o.id.slice(0, 8)}</strong>
                        <p>{new Date(o.created_at).toLocaleDateString("es-AR")}</p>
                      </div>
                      <span className="liq-order-total">
                        ${Number(o.total_amount ?? 0).toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="liq-orders-empty">
                  Esta liquidación agrupa los pedidos liberados de la semana corriente.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={reportsModalOpen} onClose={() => setReportsModalOpen(false)} title="Reportes generados">
        <div className="liquidations-reports-modal">
          <div className="liquidations-reports-modal__notice">
            <Clock size={18} />
            <p>Los archivos y sus enlaces de descarga duran 1 día. Después se eliminan automáticamente.</p>
          </div>
          {reportRequested && generatedReports.length === 0 && (
            <div className="liquidations-reports-modal__pending">
              <FileClock size={28} />
              <p>Estamos preparando tu reporte. Esta ventana se actualizará automáticamente cuando esté listo.</p>
            </div>
          )}
          {!reportRequested && generatedReports.length === 0 && (
            <div className="liquidations-reports-modal__pending">
              <FileText size={28} />
              <p>Todavía no hay reportes disponibles.</p>
            </div>
          )}
          <div className="liquidations-reports-modal__list">
            {generatedReports.map((report) => (
              <article className="liquidations-reports-modal__item" key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <span>{new Date(report.created_at).toLocaleString("es-AR")}</span>
                </div>
                <a href={report.content} target="_blank" rel="noreferrer" className="liquidations-reports-modal__download">
                  <Download size={16} /> Descargar
                </a>
              </article>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
