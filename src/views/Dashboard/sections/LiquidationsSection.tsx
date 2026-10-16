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
import DateRangeFilter, {
  DateRangeValue,
  toUtcDateRange,
} from "./DateRangeFilter";
import { localDateInputValue } from "@/utils/localDateRange";
import "./LiquidationsSection.css";

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todos los estados", value: "" },
  { label: "Disponible", value: "available" },
  { label: "En proceso", value: "in_process" },
  { label: "Liquidado", value: "settled" },
  { label: "Retenido", value: "withheld" },
  { label: "Cancelado", value: "cancelled" },
];

export default function LiquidationsSection() {
  const { sessionStatus } = useAuth();
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;
  const { data: professional } = useQuery({
    queryKey: ["professional-me", professionalId],
    queryFn: async () =>
      (await getProfessionalMeAction({ token: await getAccessToken() }))
        ?.data ?? null,
    enabled: Boolean(professionalId),
    staleTime: 1000 * 60 * 5,
  });
  const companyData = professional?.companies ?? professional?.Company;
  const company = Array.isArray(companyData) ? companyData[0] : companyData;
  const companyId =
    Number(company?.id ?? sessionStatus?.company_id) || undefined;
  const token = getAccessToken();
  setApiAccessToken(token);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [listBranchId, setListBranchId] = useState("");
  const [listDateRange, setListDateRange] = useState<DateRangeValue>({
    field: "date",
    from: "",
    to: "",
  });
  const [selectedLiquidation, setSelectedLiquidation] =
    useState<Liquidation | null>(null);
  const [reportType, setReportType] = useState<LiquidationsReportType>("full");
  const [dateFrom, setDateFrom] = useState(
    () => `${new Date().getFullYear()}-01-01`,
  );
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
    queryKey: [
      "merchant-liquidations",
      page,
      statusFilter,
      listBranchId,
      listDateRange,
    ],
    queryFn: () =>
      commerceService.liquidations(
        page,
        10,
        statusFilter || undefined,
        listBranchId || undefined,
        {
          [`${listDateRange.field}_from`]: toUtcDateRange(listDateRange).from,
          [`${listDateRange.field}_to`]: toUtcDateRange(listDateRange).to,
        },
      ),
    enabled:
      !listDateRange.from ||
      !listDateRange.to ||
      listDateRange.from <= listDateRange.to,
  });

  const liquidations = liquidationsData?.items ?? liquidationsData?.data ?? [];
  const total = liquidationsData?.total ?? liquidations.length;
  const totalPages =
    liquidationsData?.totalPages ?? (Math.ceil(total / 10) || 1);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["report-branches", companyId],
    queryFn: () => commerceService.branches(companyId!),
    enabled: Boolean(companyId),
  });

  const { data: notifications = [], refetch: refetchReports } = useQuery<
    GeneratedReportNotification[]
  >({
    queryKey: ["generated-liquidation-reports"],
    queryFn: () => commerceService.getGeneratedReports(),
    enabled: reportsModalOpen,
    refetchInterval: reportsModalOpen && reportRequested ? 8_000 : false,
  });

  const generatedReports = notifications.filter(
    (notification) => notification.type === "report_ready",
  );

  const reportMutation = useMutation({
    mutationFn: () =>
      commerceService.requestLiquidationsReport({
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
    .reduce(
      (acc, curr) =>
        acc +
        Math.max(
          0,
          Number(curr.net_amount ?? curr.amount ?? 0) -
            Number(curr.debt_offset_amount ?? 0),
        ),
      0,
    );

  const pendingReleaseBalance = liquidations
    .filter((l) => l.status === "pending" || l.status === "in_process")
    .reduce(
      (acc, curr) =>
        acc +
        Math.max(
          0,
          Number(curr.net_amount ?? curr.amount ?? 0) -
            Number(curr.debt_offset_amount ?? 0),
        ),
      0,
    );

  const historicalSettled = liquidations
    .filter((l) => l.status === "settled" || l.status === "paid")
    .reduce(
      (acc, curr) =>
        acc +
        Math.max(
          0,
          Number(curr.net_amount ?? curr.amount ?? 0) -
            Number(curr.debt_offset_amount ?? 0),
        ),
      0,
    );

  // Next automatic liquidation estimation (e.g. next Friday or end of month)
  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(
    nextPayoutDate.getDate() + ((5 - nextPayoutDate.getDay() + 7) % 7 || 7),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="liq-badge liq-badge--available">Disponible</span>
        );
      case "in_process":
      case "pending":
        return <span className="liq-badge liq-badge--process">En proceso</span>;
      case "settled":
      case "paid":
        return <span className="liq-badge liq-badge--settled">Liquidado</span>;
      case "withheld":
        return <span className="liq-badge liq-badge--withheld">Retenido</span>;
      case "cancelled":
        return <span className="liq-badge liq-badge--cancelled">Cancelado</span>;
      default:
        return <span className="liq-badge">{status}</span>;
    }
  };

  return (
    <div className="liquidations-section">
      <header className="liquidations-section__header">
        <div>
          <span className="liquidations-section__subtitle">
            Gestión Comercial
          </span>
          <h1 className="liquidations-section__title">
            Liquidaciones y Cobros
          </h1>
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
            <span className="liquidations-card__label">
              HISTÓRICO LIQUIDADO
            </span>
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
            <span className="liquidations-card__label">
              PRÓXIMA LIQUIDACIÓN
            </span>
            <span className="liquidations-card__value liquidations-card__value--date">
              {nextPayoutDate.toLocaleDateString("es-AR")}
            </span>
          </div>
        </div>
      </div>

      <section
        className="liquidations-report-panel"
        aria-labelledby="liquidations-report-title"
      >
        <div className="liquidations-report-panel__heading">
          <div>
            <span className="liquidations-report-panel__eyebrow">
              Reportes contables
            </span>
            <h2 id="liquidations-report-title">
              Exportá el período que necesitás
            </h2>
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
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label className="liquidations-report-panel__field">
            <span>Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          <label className="liquidations-report-panel__field">
            <span>Contenido</span>
            <select
              value={reportType}
              onChange={(event) =>
                setReportType(event.target.value as LiquidationsReportType)
              }
            >
              <option value="settlement">Solo liquidaciones</option>
              <option value="sale">Solo ventas</option>
              <option value="full">Ventas y liquidaciones</option>
            </select>
          </label>
          <label className="liquidations-report-panel__field">
            <span>Sucursal</span>
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="liquidations-report-panel__taxes">
            <input
              type="checkbox"
              checked={includeTaxes}
              onChange={(event) => setIncludeTaxes(event.target.checked)}
            />
            <span>Incluir impuestos y retenciones</span>
          </label>
          <button
            type="button"
            className="liquidations-report-panel__generate-btn"
            disabled={
              reportMutation.isPending ||
              !dateFrom ||
              !dateTo ||
              dateFrom > dateTo
            }
            onClick={handleGenerateReport}
          >
            <FileText size={17} />
            {reportMutation.isPending ? "Enviando..." : "Generar reporte"}
          </button>
        </div>
        {dateFrom > dateTo && (
          <p className="liquidations-report-panel__error">
            La fecha final debe ser posterior a la fecha inicial.
          </p>
        )}
        {reportMutation.isError && (
          <p className="liquidations-report-panel__error">
            {reportMutation.error.message || "No se pudo preparar el reporte."}
          </p>
        )}
      </section>

      {/* Filter Tabs */}
      <div className="liquidations-filters">
        <label className="liquidations-branch-filter">
          <span>Sucursal</span>
          <select
            value={listBranchId}
            onChange={(event) => {
              setListBranchId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
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
        onChange={(value) => {
          setListDateRange(value);
          setPage(1);
        }}
      />

      {/* Content / States */}
      {listDateRange.from &&
      listDateRange.to &&
      listDateRange.from > listDateRange.to ? null : isLoading ? (
        <div className="liquidations-state liquidations-state--loading">
          <Clock className="liquidations-state__spinner" size={32} />
          <p>Cargando liquidaciones...</p>
        </div>
      ) : isError ? (
        <div className="liquidations-state liquidations-state--error">
          <AlertCircle size={32} />
          <p>Hubo un error al obtener las liquidaciones.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : liquidations.length === 0 ? (
        <div className="liquidations-state liquidations-state--empty">
          <FileText size={48} />
          <h3>
            {statusFilter ||
            listBranchId ||
            listDateRange.from ||
            listDateRange.to
              ? "No hay liquidaciones para este filtro"
              : "No hay liquidaciones registradas"}
          </h3>
          <p>
            {statusFilter ||
            listBranchId ||
            listDateRange.from ||
            listDateRange.to
              ? "Probá con otro estado, sucursal o período."
              : "Tus ventas aparecerán aquí a medida que se cumplan los plazos de liberación."}
          </p>
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
                  const isCancelled = liq.status === "cancelled";
                  const hasChargeback =
                    Number(liq.chargeback_deduction_amount ?? 0) > 0 ||
                    Number(liq.chargeback_debt_amount ?? 0) > 0;
                  const isCancelledOrChargeback = isCancelled || hasChargeback;

                  const gross = Number(liq.gross_amount ?? liq.amount ?? 0);
                  const originalFee = isCancelledOrChargeback
                    ? 0
                    : Number(liq.platform_commission ?? liq.platform_fee ?? 0);
                  const originalIva = isCancelledOrChargeback
                    ? 0
                    : Number(liq.iva_amount ?? liq.tax_withholding ?? 0);

                  const cancellationCommission = Number(
                    liq.cancellation_commission ??
                      liq.financial_adjustments?.reduce(
                        (acc, a) =>
                          acc + Number(a.cancellation_commission_amount ?? 0),
                        0,
                      ) ??
                      0,
                  );
                  const cancellationIva = Number(
                    liq.cancellation_iva_amount ??
                      liq.financial_adjustments?.reduce(
                        (acc, a) =>
                          acc + Number(a.cancellation_iva_amount ?? 0),
                        0,
                      ) ??
                      0,
                  );

                  const displayedCommission =
                    cancellationCommission > 0
                      ? cancellationCommission
                      : originalFee;
                  const displayedTax =
                    (cancellationIva > 0 ? cancellationIva : originalIva) +
                    (['pending', 'batch_open', 'batch_closed_unpaid'].includes(liq.cancellation_fee_basis || '') ? 0 : Number(liq.iibb_amount ?? 0));

                  const rawNet = Number(
                    liq.net_amount ?? gross - originalFee - originalIva,
                  );
                  const effectiveNet =
                    rawNet < 0
                      ? rawNet
                      : Math.max(
                          0,
                          rawNet - Number(liq.debt_offset_amount ?? 0),
                        );

                  return (
                    <tr key={liq.id}>
                      <td className="liquidations-table__id">
                        #{liq.id.slice(0, 8)}
                      </td>
                      <td>
                        {liq.cutoff_date
                          ? new Date(liq.cutoff_date).toLocaleDateString(
                              "es-AR",
                            )
                          : new Date(liq.created_at).toLocaleDateString(
                              "es-AR",
                            )}
                      </td>
                      <td>${gross.toLocaleString("es-AR")}</td>
                      <td className="liquidations-table__deduction">
                        {displayedCommission > 0
                          ? `-$${displayedCommission.toLocaleString("es-AR")}`
                          : "$0"}
                        {cancellationCommission > 0 && (
                          <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                            {liq.cancellation_fee_basis === 'batch_closed_unpaid' ? 'Cargo por IVA no reintegrado' : 'Comisión por cancelación'}
                          </div>
                        )}
                      </td>
                      <td className="liquidations-table__deduction">
                        {displayedTax > 0
                          ? `-$${displayedTax.toLocaleString("es-AR")}`
                          : "$0"}
                        {cancellationIva > 0 && (
                          <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                            IVA por com. cancelación
                          </div>
                        )}
                      </td>
                      <td
                        className={
                          effectiveNet < 0
                            ? "liquidations-table__deduction"
                            : "liquidations-table__net"
                        }
                      >
                        <strong>
                          {effectiveNet < 0
                            ? `-$${Math.abs(effectiveNet).toLocaleString("es-AR")}`
                            : `$${effectiveNet.toLocaleString("es-AR")}`}
                        </strong>
                      </td>
                      <td>{getStatusBadge(liq.status)}</td>
                      <td>
                        {liq.paid_to_merchant_at
                          ? new Date(
                              liq.paid_to_merchant_at,
                            ).toLocaleDateString("es-AR")
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
      {selectedLiquidation && (() => {
        const isCancelled = selectedLiquidation.status === "cancelled";
        const hasChargeback =
          Number(selectedLiquidation.chargeback_deduction_amount ?? 0) > 0 ||
          Number(selectedLiquidation.chargeback_debt_amount ?? 0) > 0;
        const isCancelledOrChargeback = isCancelled || hasChargeback;

        const gross = Number(
          selectedLiquidation.gross_amount ?? selectedLiquidation.amount ?? 0,
        );
        const originalFee = isCancelledOrChargeback
          ? 0
          : Number(
              selectedLiquidation.platform_commission ??
                selectedLiquidation.platform_fee ??
                0,
            );
        const originalIva = isCancelledOrChargeback
          ? 0
          : Number(
              selectedLiquidation.iva_amount ??
                selectedLiquidation.tax_withholding ??
                0,
            );

        const cancellationCommission = Number(
          selectedLiquidation.cancellation_commission ??
            selectedLiquidation.financial_adjustments?.reduce(
              (acc, a) => acc + Number(a.cancellation_commission_amount ?? 0),
              0,
            ) ??
            0,
        );
        const cancellationCommissionPct = Number(
          selectedLiquidation.cancellation_commission_pct ??
            selectedLiquidation.financial_adjustments?.find(
              (a) => Number(a.cancellation_commission_pct ?? 0) > 0,
            )?.cancellation_commission_pct ??
            0,
        );
        const cancellationIva = Number(
          selectedLiquidation.cancellation_iva_amount ??
            selectedLiquidation.financial_adjustments?.reduce(
              (acc, a) => acc + Number(a.cancellation_iva_amount ?? 0),
              0,
            ) ??
            0,
        );

        const chargebackAmount = Math.max(
          Number(selectedLiquidation.chargeback_debt_amount ?? 0),
          Number(selectedLiquidation.chargeback_deduction_amount ?? 0),
        );

        const rawNet = Number(
          selectedLiquidation.net_amount ?? gross - originalFee - originalIva,
        );
        const effectiveNet =
          rawNet < 0
            ? rawNet
            : Math.max(
                0,
                rawNet - Number(selectedLiquidation.debt_offset_amount ?? 0),
              );

        return (
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
                <span>Importe bruto:</span>
                <span>${gross.toLocaleString("es-AR")}</span>
              </div>
              <div className="liq-detail-row">
                <span>Comisión Sercio:</span>
                <span className="liq-detail-deduction">
                  {originalFee > 0
                    ? `-$${originalFee.toLocaleString("es-AR")}`
                    : "$0"}
                </span>
              </div>
              {Number(selectedLiquidation.payment_provider_fee ?? 0) > 0 && !['pending', 'batch_open', 'batch_closed_unpaid'].includes(selectedLiquidation.cancellation_fee_basis || '') && (
                <div className="liq-detail-row">
                  <span>Costo del medio de pago:</span>
                  <span className="liq-detail-deduction">
                    -$
                    {Number(
                      selectedLiquidation.payment_provider_fee,
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              <div className="liq-detail-row">
                <span>IVA sobre comisión:</span>
                <span className="liq-detail-deduction">
                  {originalIva > 0
                    ? `-$${originalIva.toLocaleString("es-AR")}`
                    : "$0"}
                </span>
              </div>
              {(isCancelled ||
                cancellationCommission > 0 ||
                cancellationIva > 0) && (
                <>
                  <div className="liq-detail-row">
                    <span>
                      {selectedLiquidation.cancellation_fee_basis === 'pending' ? 'Cargo por cancelación pendiente de conciliación' : selectedLiquidation.cancellation_fee_basis === 'batch_closed_unpaid' ? 'Cargo por IVA no reintegrado por la procesadora' : 'Comisión por cancelación'}
                      {cancellationCommissionPct > 0
                        ? ` (${cancellationCommissionPct}%)`
                        : ""}
                      :
                    </span>
                    <span className="liq-detail-deduction">
                      {cancellationCommission > 0
                        ? `-$${cancellationCommission.toLocaleString("es-AR")}`
                        : "$0"}
                    </span>
                  </div>
                  <div className="liq-detail-row">
                    <span>IVA de Sercio sobre el cargo por cancelación:</span>
                    <span className="liq-detail-deduction">
                      {cancellationIva > 0
                        ? `-$${cancellationIva.toLocaleString("es-AR")}`
                        : "$0"}
                    </span>
                  </div>
                </>
              )}
              {Number(selectedLiquidation.iibb_amount ?? 0) > 0 && (
                <div className="liq-detail-row">
                  <span>{['pending', 'batch_open', 'batch_closed_unpaid'].includes(selectedLiquidation.cancellation_fee_basis || '') ? 'IIBB informado (referencia; no incluido en el cargo):' : 'Ingresos Brutos:'}</span>
                  <span>
                    {['pending', 'batch_open', 'batch_closed_unpaid'].includes(selectedLiquidation.cancellation_fee_basis || '') ? '$' : '-$'}
                    {Number(selectedLiquidation.iibb_amount).toLocaleString(
                      "es-AR",
                    )}
                  </span>
                </div>
              )}
              {Number(selectedLiquidation.other_deductions ?? 0) > 0 && (
                <div className="liq-detail-row">
                  <span>Otras deducciones:</span>
                  <span className="liq-detail-deduction">
                    -$
                    {Number(
                      selectedLiquidation.other_deductions,
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              {Number(selectedLiquidation.refunded_gross_amount ?? 0) > 0 && (
                <div className="liq-detail-row">
                  <span>Devuelto al comprador (referencia):</span>
                  <span>
                    $
                    {Number(
                      selectedLiquidation.refunded_gross_amount,
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              {Number(selectedLiquidation.refund_deduction_amount ?? 0) > 0 && (
                <div className="liq-detail-row">
                  <span>Deducción por cancelación/devolución:</span>
                  <span className="liq-detail-deduction">
                    -$
                    {Number(
                      selectedLiquidation.refund_deduction_amount,
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              {Number(selectedLiquidation.refund_debt_amount ?? 0) > 0 && (
                <div className="liq-detail-row">
                  <span>Total de deuda generada — incluye los cargos anteriores:</span>
                  <span>
                    $
                    {Number(
                      selectedLiquidation.refund_debt_amount,
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              {chargebackAmount > 0 && (
                <div className="liq-detail-row">
                  <span>Contracargo por total de la venta:</span>
                  <span className="liq-detail-deduction">
                    -${chargebackAmount.toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              {Number(selectedLiquidation.debt_offset_amount ?? 0) > 0 && (
                <div className="liq-detail-row">
                  <span>Deuda compensada:</span>
                  <span className="liq-detail-deduction">
                    -$
                    {Number(
                      selectedLiquidation.debt_offset_amount,
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              <div className="liq-detail-row liq-detail-row--total">
                <span>
                  {effectiveNet < 0
                    ? "Saldo negativo al comercio:"
                    : selectedLiquidation.paid_to_merchant_at
                      ? "Neto transferido al comercio:"
                      : "Neto a transferir:"}
                </span>
                <span
                  className={effectiveNet < 0 ? "liq-detail-deduction" : ""}
                >
                  {effectiveNet < 0
                    ? `-$${Math.abs(effectiveNet).toLocaleString("es-AR")}`
                    : `$${effectiveNet.toLocaleString("es-AR")}`}
                </span>
              </div>

              <div className="liq-detail-orders-section">
                <h4>Órdenes asociadas</h4>
                {selectedLiquidation.orders &&
                selectedLiquidation.orders.length > 0 ? (
                  <div className="liq-orders-list">
                    {selectedLiquidation.orders.map((o) => (
                      <div key={o.id} className="liq-order-item">
                        <div>
                          <strong>#{o.order_number || o.id.slice(0, 8)}</strong>
                          <p>
                            {new Date(o.created_at).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                        <span className="liq-order-total">
                          ${Number(o.total_amount ?? 0).toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="liq-orders-empty">
                    Esta liquidación agrupa los pedidos liberados de la semana
                    corriente.
                  </p>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      <Modal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        title="Reportes generados"
      >
        <div className="liquidations-reports-modal">
          <div className="liquidations-reports-modal__notice">
            <Clock size={18} />
            <p>
              Los archivos y sus enlaces de descarga duran 1 día. Después se
              eliminan automáticamente.
            </p>
          </div>
          {reportRequested && generatedReports.length === 0 && (
            <div className="liquidations-reports-modal__pending">
              <FileClock size={28} />
              <p>
                Estamos preparando tu reporte. Esta ventana se actualizará
                automáticamente cuando esté listo.
              </p>
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
              <article
                className="liquidations-reports-modal__item"
                key={report.id}
              >
                <div>
                  <strong>{report.title}</strong>
                  <span>
                    {new Date(report.created_at).toLocaleString("es-AR")}
                  </span>
                </div>
                <a
                  href={report.content}
                  target="_blank"
                  rel="noreferrer"
                  className="liquidations-reports-modal__download"
                >
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
