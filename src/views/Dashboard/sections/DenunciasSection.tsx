"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  FileText,
  Flag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  ChevronRight,
  MessageSquare,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import {
  listingReportsService,
  ListingReportItem,
} from "@/services/listingReportsService";
import "./DenunciasSection.css";

const REASONS_MAP: Record<string, string> = {
  counterfeit: "Posible falsificación",
  adulterated: "Producto adulterado",
  misleading: "Información engañosa",
  prohibited: "Contenido prohibido",
  inappropriate: "Contenido inapropiado",
  other: "Otro motivo",
};

const STATUS_MAP: Record<string, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  dismissed: "Descartada",
  actioned: "Medida tomada",
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getStatusExplanation(status?: string): string {
  switch (status) {
    case "pending":
      return "Estado Pendiente: Esta denuncia fue recibida y se encuentra a la espera de ser analizada por el equipo de moderación. El contenido continúa publicado con normalidad.";
    case "in_review":
      return "Estado En Revisión: Un agente de soporte está contrastando la publicación con las políticas de Sercio. Te contactaremos si se requiere información adicional.";
    case "dismissed":
      return "Estado Descartada: La denuncia fue revisada y desestimada por considerarse infundada o falsa. No se aplicó ninguna sanción ni cambio.";
    case "actioned":
      return "Estado Medida Tomada: Se determinó que la publicación incumplía las normativas. Podés revisar o editar tu producto para ajustarlo a las políticas.";
    default:
      return "Sercio gestiona las denuncias con total transparencia y neutralidad para proteger a compradores y comercios.";
  }
}

export default function DenunciasSection() {
  const searchParams = useSearchParams();
  const targetIdParam = searchParams.get("targetId");

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] =
    useState<ListingReportItem | null>(null);

  const {
    data: allReports = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["merchant-listing-reports"],
    queryFn: () => listingReportsService.getMyReports(),
    staleTime: 60 * 1000,
  });

  // Auto-open detail if targetIdParam matches a report
  useEffect(() => {
    if (targetIdParam && allReports.length > 0 && !selectedReport) {
      const matched = allReports.find(
        (r) => r.target_id === targetIdParam || r.id === targetIdParam,
      );
      if (matched) {
        setSelectedReport(matched);
      }
    }
  }, [targetIdParam, allReports, selectedReport]);

  const productCount = useMemo(
    () =>
      allReports.filter((r) => r.target_type === "professional_product").length,
    [allReports],
  );
  const pubCount = useMemo(
    () =>
      allReports.filter((r) => r.target_type === "professional_publication")
        .length,
    [allReports],
  );
  const pendingCount = useMemo(
    () =>
      allReports.filter(
        (r) => r.status === "pending" || r.status === "in_review",
      ).length,
    [allReports],
  );
  const resolvedCount = useMemo(
    () =>
      allReports.filter(
        (r) => r.status === "dismissed" || r.status === "actioned",
      ).length,
    [allReports],
  );

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      // Type filter
      if (typeFilter !== "all" && r.target_type !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === "pending") {
        if (r.status !== "pending" && r.status !== "in_review") return false;
      } else if (statusFilter === "resolved") {
        if (r.status !== "dismissed" && r.status !== "actioned") return false;
      }
      return true;
    });
  }, [allReports, typeFilter, statusFilter]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return {
          label: STATUS_MAP.pending,
          className: "denuncia-badge--pending",
          icon: <Clock size={13} />,
        };
      case "in_review":
        return {
          label: STATUS_MAP.in_review,
          className: "denuncia-badge--in-review",
          icon: <Eye size={13} />,
        };
      case "dismissed":
        return {
          label: STATUS_MAP.dismissed,
          className: "denuncia-badge--dismissed",
          icon: <CheckCircle2 size={13} />,
        };
      case "actioned":
        return {
          label: STATUS_MAP.actioned,
          className: "denuncia-badge--actioned",
          icon: <AlertTriangle size={13} />,
        };
      default:
        return {
          label: status || "Desconocido",
          className: "denuncia-badge--default",
          icon: <HelpCircle size={13} />,
        };
    }
  };

  return (
    <div className="denuncias-section">
      {/* ── HEADER ── */}
      <div className="denuncias-section__header">
        <div className="denuncias-section__title-group">
          <div className="denuncias-section__badge">
            <ShieldAlert size={14} />
            <span>Moderación</span>
          </div>
          <h1 className="denuncias-section__title">
            Denuncias Recibidas
            {allReports.length > 0 && (
              <span className="denuncias-section__count">
                ({allReports.length})
              </span>
            )}
          </h1>
        </div>

        <button
          type="button"
          className="denuncias-section__refresh-btn"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          title="Actualizar denuncias"
          aria-label="Refrescar denuncias"
        >
          <RefreshCw
            size={16}
            className={isLoading || isRefetching ? "animate-spin" : ""}
          />
          <span>Refrescar</span>
        </button>
      </div>

      {/* ── BANNER DE PROTECCIÓN Y MODERACIÓN ── */}
      <div className="denuncias-section__info-banner">
        <div className="denuncias-section__info-icon">
          <ShieldCheck size={26} />
        </div>
        <div className="denuncias-section__info-body">
          <h3 className="denuncias-section__info-title">
            Protección y Moderación Sercio
          </h3>
          <p className="denuncias-section__info-desc">
            Sercio revisa de manera neutral cada denuncia antes de tomar
            cualquier medida. Tus publicaciones y productos no sufren
            modificaciones automáticas por recibir un reporte.
          </p>
        </div>
      </div>

      {/* ── FILTROS ── */}
      <div className="denuncias-section__filters">
        <div className="denuncias-section__filter-row">
          <button
            type="button"
            className={`denuncias-chip ${typeFilter === "all" ? "denuncias-chip--active" : ""}`}
            onClick={() => setTypeFilter("all")}
          >
            <Layers size={14} />
            <span>Todas ({allReports.length})</span>
          </button>
          <button
            type="button"
            className={`denuncias-chip ${typeFilter === "professional_product" ? "denuncias-chip--active" : ""}`}
            onClick={() => setTypeFilter("professional_product")}
          >
            <Package size={14} />
            <span>Productos ({productCount})</span>
          </button>
          <button
            type="button"
            className={`denuncias-chip ${typeFilter === "professional_publication" ? "denuncias-chip--active" : ""}`}
            onClick={() => setTypeFilter("professional_publication")}
          >
            <FileText size={14} />
            <span>Publicaciones ({pubCount})</span>
          </button>
        </div>

        <div className="denuncias-section__filter-row">
          <button
            type="button"
            className={`denuncias-chip denuncias-chip--subtle ${statusFilter === "all" ? "denuncias-chip--active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span>Todos los estados</span>
          </button>
          <button
            type="button"
            className={`denuncias-chip denuncias-chip--subtle ${statusFilter === "pending" ? "denuncias-chip--active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <Clock size={13} className="denuncias-chip__icon--amber" />
            <span>Pendientes ({pendingCount})</span>
          </button>
          <button
            type="button"
            className={`denuncias-chip denuncias-chip--subtle ${statusFilter === "resolved" ? "denuncias-chip--active" : ""}`}
            onClick={() => setStatusFilter("resolved")}
          >
            <CheckCircle2 size={13} className="denuncias-chip__icon--green" />
            <span>Resueltas ({resolvedCount})</span>
          </button>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      {isLoading ? (
        <div className="denuncias-section__loading">
          <RefreshCw size={28} className="animate-spin" />
          <span>Cargando denuncias...</span>
        </div>
      ) : error ? (
        <div className="denuncias-section__error">
          <AlertTriangle size={36} />
          <h4>No se pudieron cargar las denuncias</h4>
          <p>Ocurrió un error al consultar las denuncias recibidas.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : allReports.length === 0 ? (
        <div className="denuncias-section__empty-state">
          <div className="denuncias-section__empty-icon-wrap">
            <ShieldCheck size={48} />
          </div>
          <h3 className="denuncias-section__empty-title">
            ¡Sin denuncias registradas!
          </h3>
          <p className="denuncias-section__empty-text">
            No tenés ninguna denuncia recibida en tus productos o publicaciones.
            Tu catálogo mantiene un excelente estándar de calidad y
            cumplimiento.
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="denuncias-section__empty-state">
          <div className="denuncias-section__empty-icon-wrap denuncias-section__empty-icon-wrap--subtle">
            <HelpCircle size={40} />
          </div>
          <h3 className="denuncias-section__empty-title">Sin resultados</h3>
          <p className="denuncias-section__empty-text">
            No se encontraron denuncias con los filtros seleccionados.
          </p>
          <button
            type="button"
            className="denuncias-chip denuncias-chip--active"
            onClick={() => {
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="denuncias-section__list">
          {filteredReports.map((report) => {
            const isProduct = report.target_type === "professional_product";
            const targetTitle =
              report.target_title ||
              report.target_snapshot?.title ||
              report.target_id ||
              (isProduct ? "Producto" : "Publicación");
            const reasonText = REASONS_MAP[report.reason] || report.reason;
            const badge = getStatusBadge(report.status);
            const isHighlighted =
              targetIdParam &&
              (report.target_id === targetIdParam ||
                report.id === targetIdParam);

            return (
              <article
                key={report.id}
                className={`denuncia-card ${isHighlighted ? "denuncia-card--highlighted" : ""}`}
                onClick={() => setSelectedReport(report)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedReport(report);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalle de denuncia sobre ${targetTitle}`}
              >
                <div className="denuncia-card__top">
                  <div className="denuncia-card__type-icon">
                    {isProduct ? <Package size={22} /> : <FileText size={22} />}
                  </div>

                  <div className="denuncia-card__main-info">
                    <div className="denuncia-card__meta-row">
                      <span className="denuncia-card__tag">
                        {isProduct ? "PRODUCTO" : "PUBLICACIÓN"}
                      </span>
                      <span className={`denuncia-badge ${badge.className}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <h3
                      className="denuncia-card__target-title"
                      title={targetTitle}
                    >
                      {targetTitle}
                    </h3>
                  </div>
                </div>

                <div className="denuncia-card__divider" />

                <div className="denuncia-card__reason-row">
                  <Flag size={15} className="denuncia-card__reason-icon" />
                  <span className="denuncia-card__reason-label">Motivo:</span>
                  <span className="denuncia-card__reason-value">
                    {reasonText}
                  </span>
                </div>

                {report.details && report.details.trim().length > 0 && (
                  <div className="denuncia-card__observation">
                    <p>"{report.details}"</p>
                  </div>
                )}

                {report.admin_notes && report.admin_notes.trim().length > 0 && (
                  <div className="denuncia-card__admin-notes">
                    <span className="denuncia-card__admin-notes-title">
                      Mensaje de Sercio:
                    </span>
                    <p>{report.admin_notes}</p>
                  </div>
                )}

                <div className="denuncia-card__footer">
                  <div className="denuncia-card__date">
                    <Clock size={13} />
                    <span>Recibida: {formatDate(report.created_at)}</span>
                  </div>

                  <div className="denuncia-card__action">
                    <span>Ver detalle</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── MODAL DETALLE DE LA DENUNCIA ── */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Detalle de la Denuncia"
        maxWidth="560px"
      >
        {selectedReport && (
          <div className="denuncia-modal">
            {/* Cabecera del modal */}
            <div className="denuncia-modal__status-bar">
              <span className="denuncia-modal__type-tag">
                {selectedReport.target_type === "professional_product"
                  ? "PRODUCTO REPORTADO"
                  : "PUBLICACIÓN REPORTADA"}
              </span>
              <span
                className={`denuncia-badge ${getStatusBadge(selectedReport.status).className}`}
              >
                {getStatusBadge(selectedReport.status).icon}
                <span>{getStatusBadge(selectedReport.status).label}</span>
              </span>
            </div>

            {/* Datos principales */}
            <div className="denuncia-modal__item">
              <div className="denuncia-modal__item-header">
                {selectedReport.target_type === "professional_product" ? (
                  <Package size={15} className="denuncia-modal__item-icon" />
                ) : (
                  <FileText size={15} className="denuncia-modal__item-icon" />
                )}
                <span>
                  {selectedReport.target_type === "professional_product"
                    ? "Producto denunciado"
                    : "Publicación denunciada"}
                </span>
              </div>
              <p className="denuncia-modal__item-value">
                {selectedReport.target_title ||
                  selectedReport.target_snapshot?.title ||
                  selectedReport.target_id}
              </p>
            </div>

            <div className="denuncia-modal__item">
              <div className="denuncia-modal__item-header">
                <Flag size={15} className="denuncia-modal__item-icon" />
                <span>Motivo del reporte</span>
              </div>
              <p className="denuncia-modal__item-value">
                {REASONS_MAP[selectedReport.reason] || selectedReport.reason}
              </p>
            </div>

            {selectedReport.details &&
              selectedReport.details.trim().length > 0 && (
                <div className="denuncia-modal__item">
                  <div className="denuncia-modal__item-header">
                    <MessageSquare
                      size={15}
                      className="denuncia-modal__item-icon"
                    />
                    <span>Observación del denunciante</span>
                  </div>
                  <div className="denuncia-modal__boxed-content">
                    <p>{selectedReport.details}</p>
                  </div>
                </div>
              )}

            {selectedReport.admin_notes &&
              selectedReport.admin_notes.trim().length > 0 && (
                <div className="denuncia-modal__item">
                  <div className="denuncia-modal__item-header">
                    <ShieldCheck
                      size={15}
                      className="denuncia-modal__item-icon denuncia-modal__item-icon--admin"
                    />
                    <span className="denuncia-modal__item-title--admin">
                      Mensaje de Sercio (Administración)
                    </span>
                  </div>
                  <div className="denuncia-modal__boxed-content denuncia-modal__boxed-content--admin">
                    <p>{selectedReport.admin_notes}</p>
                  </div>
                </div>
              )}

            {selectedReport.target_snapshot?.description && (
              <div className="denuncia-modal__item">
                <div className="denuncia-modal__item-header">
                  <FileText size={15} className="denuncia-modal__item-icon" />
                  <span>Descripción registrada</span>
                </div>
                <div className="denuncia-modal__boxed-content">
                  <p>{selectedReport.target_snapshot.description}</p>
                </div>
              </div>
            )}

            <div className="denuncia-modal__item">
              <div className="denuncia-modal__item-header">
                <Calendar size={15} className="denuncia-modal__item-icon" />
                <span>Fecha de recepción</span>
              </div>
              <p className="denuncia-modal__item-value">
                {formatDate(selectedReport.created_at)}
              </p>
            </div>

            {selectedReport.reviewed_at && (
              <div className="denuncia-modal__item">
                <div className="denuncia-modal__item-header">
                  <CheckCircle2
                    size={15}
                    className="denuncia-modal__item-icon"
                  />
                  <span>Fecha de resolución</span>
                </div>
                <p className="denuncia-modal__item-value">
                  {formatDate(selectedReport.reviewed_at)}
                </p>
              </div>
            )}

            {/* Explicación de estado */}
            <div className="denuncia-modal__explanation">
              <p>{getStatusExplanation(selectedReport.status)}</p>
            </div>

            {/* Botón cerrar modal */}
            <div className="denuncia-modal__actions">
              <button
                type="button"
                className="btn-primary denuncia-modal__close-btn"
                onClick={() => setSelectedReport(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
