"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Plus,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  FileText,
  Calendar,
  Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import {
  createErrorReportAction,
  getErrorReportsByUserIdAction,
  ErrorReport,
} from "@/app/actions/errorReports";
import "./ErrorReportSection.css";

const STATE_CONFIG: Record<
  string,
  { label: string; class: string; icon: React.ReactNode }
> = {
  pendiente: {
    label: "Pendiente",
    class: "error-report__badge--pending",
    icon: <Clock size={13} />,
  },
  en_revision: {
    label: "En revisión",
    class: "error-report__badge--in-progress",
    icon: <RefreshCw size={13} />,
  },
  resuelto: {
    label: "Resuelto",
    class: "error-report__badge--resolved",
    icon: <CheckCircle2 size={13} />,
  },
  rechazado: {
    label: "Rechazado",
    class: "error-report__badge--rejected",
    icon: <XCircle size={13} />,
  },
};

const normalizeState = (state?: string) => {
  const value = (state || "").toLowerCase();

  if (value === "pending" || value === "pendiente") return "pendiente";
  if (value === "in_review" || value === "en_revision") return "en_revision";
  if (value === "resolved" || value === "resuelto") return "resuelto";
  if (value === "rejected" || value === "rechazado") return "rechazado";

  return value;
};

export default function ErrorReportSection() {
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [filterState, setFilterState] = useState<string>("all");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    text: string;
  }>({ isOpen: false, text: "" });

  const userId = user?.id;

  // Query mis reportes de errores
  const {
    data: reports = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["error-reports", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await getErrorReportsByUserIdAction({ userId });
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data ?? [];
    },
    enabled: !!userId,
  });

  // Mutación para crear reporte
  const createMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await createErrorReportAction({
        text,
        state: "pendiente",
      });
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["error-reports", userId] });
      showSuccess(
        "Reporte enviado con éxito. Nuestro equipo lo revisará pronto. ✨",
      );
      setReportText("");
      setIsModalOpen(false);
      setConfirmModal({ isOpen: false, text: "" });
    },
    onError: (err: any) => {
      showError(
        err.message || "Error al enviar el reporte. Inténtalo nuevamente.",
      );
    },
  });

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      showError("Por favor ingresa una descripción detallada del error.");
      return;
    }
    setConfirmModal({ isOpen: true, text: reportText.trim() });
  };

  const handleExecuteSend = () => {
    if (!confirmModal.text) return;
    createMutation.mutate(confirmModal.text);
  };

  // Filtrado de reportes
  const filteredReports = useMemo(() => {
    if (filterState === "all") return reports;
    return reports.filter((r) => normalizeState(r.state) === filterState);
  }, [reports, filterState]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="error-report">
      {/* Header de la sección */}
      <div className="error-report__header">
        <div className="error-report__header-info">
          <div className="error-report__header-title-row">
            <AlertTriangle className="error-report__header-icon" size={24} />
            <h1 className="error-report__title">Reporte de Errores</h1>
          </div>
          <p className="error-report__subtitle">
            Notificá cualquier inconveniente o fallo en la plataforma. Podrás
            realizar el seguimiento del estado de tu reporte en tiempo real.
          </p>
        </div>

        <button
          type="button"
          className="error-report__btn-new"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      {/* Toolbar / Filtros */}
      <div className="error-report__toolbar">
        <div className="error-report__filter-group">
          <Filter size={16} className="error-report__filter-icon" />
          <span className="error-report__filter-label">Estado:</span>
          <div className="error-report__filter-chips">
            {[
              { id: "all", label: "Todos" },
              { id: "pendiente", label: "Pendientes" },
              { id: "en_revision", label: "En revisión" },
              { id: "resuelto", label: "Resueltos" },
              { id: "rechazado", label: "Rechazados" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`error-report__chip ${
                  filterState === f.id ? "error-report__chip--active" : ""
                }`}
                onClick={() => setFilterState(f.id)}
              >
                {f.label}
              </button>
            ))}

            <button
              type="button"
              className="error-report__btn-refresh"
              onClick={() => refetch()}
              disabled={isRefetching}
              title="Actualizar listado"
            >
              <RefreshCw
                size={16}
                className={isRefetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Listado de reportes */}
      <div className="error-report__content">
        {isLoading ? (
          <div className="error-report__loading">
            <Loader2 size={32} className="animate-spin" />
            <p>Cargando reportes de errores...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="error-report__empty">
            <FileText size={48} className="error-report__empty-icon" />
            <h3>No hay reportes de errores</h3>
            <p>
              {filterState === "all"
                ? "Aún no has reportado ningún fallo. Si experimentás un problema, hacé clic en 'Nuevo Reporte'."
                : "No hay reportes que coincidan con el filtro seleccionado."}
            </p>
          </div>
        ) : (
          <div className="error-report__grid">
            {filteredReports.map((item: ErrorReport) => {
              const stateKey = normalizeState(item.state);
              const stateInfo = STATE_CONFIG[stateKey] || {
                label: item.state,
                class: "error-report__badge--default",
                icon: <HelpCircle size={13} />,
              };

              return (
                <div key={item.id} className="error-report__card">
                  <div className="error-report__card-header">
                    <span className={`error-report__badge ${stateInfo.class}`}>
                      {stateInfo.icon}
                      <span>{stateInfo.label}</span>
                    </span>
                    <span className="error-report__date">
                      <Calendar size={13} />
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <div className="error-report__card-body">
                    <p className="error-report__card-text">{item.text}</p>
                  </div>

                  <div className="error-report__card-footer">
                    <span className="error-report__id-code">ID: {item.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Crear Reporte */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!createMutation.isPending) {
            setIsModalOpen(false);
            setReportText("");
          }
        }}
        title="Crear Reporte de Error 🛠️"
        maxWidth="580px"
      >
        <form onSubmit={handleOpenConfirm} className="error-report-form">
          <p className="error-report-form__subtitle">
            Describí detalladamente el error o falla encontrada en la plataforma
            para que nuestro equipo técnico pueda solucionarlo a la brevedad.
          </p>

          <div className="error-report-form__field">
            <label htmlFor="reportText">
              Descripción del Error{" "}
              <span className="error-report-form__req">*</span>
            </label>
            <textarea
              id="reportText"
              rows={5}
              maxLength={5000}
              placeholder="Ej: Al intentar subir un servicio me aparece un mensaje de error o la pantalla queda en blanco..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              disabled={createMutation.isPending}
              required
            />
            <span className="error-report-form__hint">
              {reportText.length} / 5000 caracteres
            </span>
          </div>

          <div className="error-report-form__actions">
            <button
              type="button"
              className="error-report-form__btn-cancel"
              onClick={() => {
                setIsModalOpen(false);
                setReportText("");
              }}
              disabled={createMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="error-report-form__btn-submit"
              disabled={createMutation.isPending || !reportText.trim()}
            >
              <Send size={16} />
              <span>Siguiente</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación Establecido */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          if (!createMutation.isPending) {
            setConfirmModal({ isOpen: false, text: "" });
          }
        }}
        title="Confirmar Envíos de Reporte"
        maxWidth="500px"
      >
        <div className="error-report-confirm">
          <div className="error-report-confirm__icon-wrap">
            <AlertTriangle size={36} />
          </div>

          <h3 className="error-report-confirm__title">
            ¿Deseás enviar este reporte de error?
          </h3>
          <p className="error-report-confirm__desc">
            Una vez enviado, un miembro de nuestro equipo analizará el problema
            registrado.
          </p>

          <div className="error-report-confirm__preview">
            <MessageSquare size={16} />
            <p>"{confirmModal.text}"</p>
          </div>

          <div className="error-report-confirm__actions">
            <button
              type="button"
              className="error-report-confirm__btn-back"
              onClick={() => setConfirmModal({ isOpen: false, text: "" })}
              disabled={createMutation.isPending}
            >
              Modificar
            </button>
            <button
              type="button"
              className="error-report-confirm__btn-confirm"
              onClick={handleExecuteSend}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Confirmar y Enviar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
