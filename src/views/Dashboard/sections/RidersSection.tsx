"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  Plus,
  User,
  Phone,
  Mail,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Pencil,
  Trash2,
  KeyRound,
  X,
  Save,
  ChevronRight,
  IdCard,
} from "lucide-react";
import {
  commerceService,
  RiderEmployee,
  RiderVehicle,
  RiderDocument,
} from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import Modal from "@/components/Modal/Modal";
import "./RidersSection.css";

/* ─── Types ─────────────────────────────────────────────── */
type FormMode = "create" | "edit";

interface RiderForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  dni: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number | "";
  license_plate: string;
  capacity_kg: number | "";
}

const EMPTY_FORM: RiderForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  dni: "",
  vehicle_type: "motorcycle",
  brand: "",
  model: "",
  year: "",
  license_plate: "",
  capacity_kg: "",
};

const REQUIRED_DOCS = [
  { type: "driving_license", label: "Licencia de Conducir" },
  { type: "vehicle_registration", label: "Cédula del Vehículo" },
  { type: "insurance", label: "Póliza de Seguro al Día" },
  { type: "vtv_rto", label: "VTV / RTO Vigente" },
  { type: "criminal_record", label: "Certificado de Antecedentes Penales" },
];

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Moto",
  car: "Automóvil",
  pickup: "Camioneta",
  van: "Furgón",
  truck: "Camión",
};

/* ─── Component ──────────────────────────────────────────── */
export default function RidersSection() {
  const token = getAccessToken();
  setApiAccessToken(token);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  /* ── form state ── */
  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RiderForm>(EMPTY_FORM);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  /* ── docs modal ── */
  const [docsRider, setDocsRider] = useState<RiderEmployee | null>(null);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [docType, setDocType] = useState("driving_license");
  const [docExpiry, setDocExpiry] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);

  /* ── delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState<RiderEmployee | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(0);
  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  /* ─── Queries ─────────────────────────────────────────── */
  const {
    data: riders = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<RiderEmployee[]>({
    queryKey: ["logistics-employees"],
    queryFn: () => commerceService.employees(),
  });

  const {
    data: riderDocs = [],
    refetch: refetchDocs,
    isLoading: isLoadingDocs,
  } = useQuery<RiderDocument[]>({
    queryKey: ["rider-documents", docsRider?.id],
    queryFn: () =>
      docsRider
        ? commerceService.documents(docsRider.id)
        : Promise.resolve([]),
    enabled: Boolean(docsRider),
  });

  /* ─── Mutations ───────────────────────────────────────── */
  const createMutation = useMutation({
    mutationFn: async () => {
      const employee = await commerceService.createEmployee({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        phone: form.phone.trim() || undefined,
        dni: form.dni.trim() || undefined,
        status: "active",
      });

      if (employee.id && form.license_plate.trim()) {
        await commerceService.createVehicle(employee.id, {
          vehicle_type: form.vehicle_type,
          brand: form.brand.trim() || undefined,
          model: form.model.trim() || undefined,
          year: typeof form.year === "number" ? form.year : undefined,
          license_plate: form.license_plate.trim(),
          capacity_kg:
            typeof form.capacity_kg === "number" ? form.capacity_kg : undefined,
          is_active: true,
        });
      }
      return employee;
    },
    onSuccess: () => {
      showSuccess("Rider registrado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      resetForm();
    },
    onError: (e: any) =>
      showError(e?.message || "Error al dar de alta al rider."),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      await commerceService.updateEmployee(editingId, {
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        dni: form.dni.trim() || undefined,
      });
      if (changePassword && newPassword.length >= 6) {
        await commerceService.updateEmployeePassword(editingId, newPassword);
      }
    },
    onSuccess: () => {
      showSuccess("Datos del rider actualizados.");
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      resetForm();
    },
    onError: (e: any) =>
      showError(e?.message || "Error al actualizar el rider."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commerceService.deleteEmployee(id),
    onSuccess: () => {
      showSuccess("Rider dado de baja correctamente.");
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      setDeleteTarget(null);
    },
    onError: () => showError("Error al dar de baja al rider."),
  });

  /* ─── Helpers ─────────────────────────────────────────── */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setMode("create");
    setEditingId(null);
    setChangePassword(false);
    setNewPassword("");
  };

  const startEdit = (r: RiderEmployee) => {
    setMode("edit");
    setEditingId(r.id);
    setChangePassword(false);
    setNewPassword("");
    setForm({
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
      email: r.email ?? "",
      password: "",
      phone: r.phone ?? "",
      dni: r.dni ?? "",
      vehicle_type:
        (r.vehicle ?? r.vehicles?.[0])?.vehicle_type ?? "motorcycle",
      brand: (r.vehicle ?? r.vehicles?.[0])?.brand ?? "",
      model: (r.vehicle ?? r.vehicles?.[0])?.model ?? "",
      year: (r.vehicle ?? r.vehicles?.[0])?.year ?? "",
      license_plate: (r.vehicle ?? r.vehicles?.[0])?.license_plate ?? "",
      capacity_kg: (r.vehicle ?? r.vehicles?.[0])?.capacity_kg ?? "",
    });
    // Scroll to form
    document
      .getElementById("riders-form-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setField = <K extends keyof RiderForm>(key: K, val: RiderForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const getDocStatus = (expiresAt?: string | null) => {
    if (!expiresAt) return { label: "Sin vencimiento", color: "green" };
    if (!currentTime) return { label: "Vigente", color: "green" };
    const exp = new Date(expiresAt).getTime();
    const daysLeft = (exp - currentTime) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) return { label: "Vencido", color: "red" };
    if (daysLeft <= 30)
      return { label: `Vence en ${Math.ceil(daysLeft)} días`, color: "amber" };
    return { label: "Al día", color: "green" };
  };

  /* ─── Document upload ─────────────────────────────────── */
  const handleDocUpload = async () => {
    if (!docsRider || !docFileRef.current?.files?.[0]) {
      showError("Seleccioná un archivo antes de subir.");
      return;
    }
    const file = docFileRef.current.files[0];
    setUploadingDoc(true);
    try {
      const { signedUrl, storage_path } =
        await commerceService.createDocumentUploadUrl(docsRider.id, file.name);

      await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await commerceService.createDocument(docsRider.id, {
        document_type: docType,
        storage_path,
        file_name: file.name,
        mime_type: file.type,
        expires_at: docExpiry || undefined,
      });

      showSuccess("Documento subido correctamente.");
      refetchDocs();
      setAddDocOpen(false);
      setDocExpiry("");
      if (docFileRef.current) docFileRef.current.value = "";
    } catch (e: any) {
      showError(e?.message || "Error al subir el documento.");
    } finally {
      setUploadingDoc(false);
    }
  };

  /* ─── Render ──────────────────────────────────────────── */
  return (
    <div className="riders-section">
      <header className="riders-section__header">
        <div>
          <span className="riders-section__subtitle">Gestión de Logística</span>
          <h1 className="riders-section__title">Riders y Fleteros</h1>
        </div>
      </header>

      <div className="riders-layout">
        {/* ── LEFT: Form ─────────────────────────────────── */}
        <aside className="riders-form-panel" id="riders-form-panel">
          <div className="riders-form-card">
            <div className="riders-form-card__header">
              <h2 className="riders-form-card__title">
                {mode === "create" ? (
                  <>
                    <Plus size={18} />
                    Dar de alta rider
                  </>
                ) : (
                  <>
                    <Pencil size={18} />
                    Editar rider
                  </>
                )}
              </h2>
              {mode === "edit" && (
                <button
                  type="button"
                  className="riders-form-card__cancel"
                  onClick={resetForm}
                >
                  <X size={16} />
                  Cancelar edición
                </button>
              )}
            </div>

            <form
              className="riders-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === "create") createMutation.mutate();
                else updateMutation.mutate();
              }}
            >
              {/* Personal data */}
              <h4 className="riders-form__subtitle">Datos Personales</h4>

              <div className="riders-form__row">
                <div className="riders-form__group">
                  <label className="riders-form__label">Nombre *</label>
                  <input
                    required
                    type="text"
                    placeholder="Juan"
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                  />
                </div>
                <div className="riders-form__group">
                  <label className="riders-form__label">Apellido *</label>
                  <input
                    required
                    type="text"
                    placeholder="Pérez"
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="riders-form__row">
                <div className="riders-form__group">
                  <label className="riders-form__label">DNI</label>
                  <input
                    type="text"
                    placeholder="38123456"
                    value={form.dni}
                    onChange={(e) => setField("dni", e.target.value)}
                  />
                </div>
                <div className="riders-form__group">
                  <label className="riders-form__label">Teléfono Móvil</label>
                  <input
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>
              </div>

              {/* Access credentials */}
              <h4 className="riders-form__subtitle">Acceso a la App</h4>

              <div className="riders-form__group">
                <label className="riders-form__label">
                  Email de Acceso {mode === "create" ? "*" : ""}
                </label>
                <input
                  type="email"
                  required={mode === "create"}
                  disabled={mode === "edit"}
                  placeholder="chofer@empresa.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
                {mode === "edit" && (
                  <span className="riders-form__hint">
                    El email no puede cambiarse por seguridad.
                  </span>
                )}
              </div>

              {mode === "create" ? (
                <div className="riders-form__group">
                  <label className="riders-form__label">
                    Contraseña Inicial *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                  />
                </div>
              ) : (
                <div className="riders-form__group">
                  <label className="riders-form__label riders-form__label--toggle">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                    />
                    Cambiar contraseña
                  </label>
                  {changePassword && (
                    <input
                      type="password"
                      minLength={6}
                      required
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  )}
                </div>
              )}

              {/* Vehicle */}
              {mode === "create" && (
                <>
                  <h4 className="riders-form__subtitle">Vehículo Asignado</h4>

                  <div className="riders-form__row">
                    <div className="riders-form__group">
                      <label className="riders-form__label">
                        Tipo de Vehículo *
                      </label>
                      <select
                        value={form.vehicle_type}
                        onChange={(e) =>
                          setField("vehicle_type", e.target.value)
                        }
                      >
                        {Object.entries(VEHICLE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="riders-form__group">
                      <label className="riders-form__label">
                        Patente / Dominio
                      </label>
                      <input
                        type="text"
                        placeholder="AB123CD"
                        value={form.license_plate}
                        onChange={(e) =>
                          setField(
                            "license_plate",
                            e.target.value.toUpperCase()
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="riders-form__row">
                    <div className="riders-form__group">
                      <label className="riders-form__label">
                        Marca y Modelo
                      </label>
                      <input
                        type="text"
                        placeholder="Honda XR 250"
                        value={form.brand}
                        onChange={(e) => setField("brand", e.target.value)}
                      />
                    </div>
                    <div className="riders-form__group">
                      <label className="riders-form__label">
                        Capacidad de Carga (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="30"
                        value={form.capacity_kg}
                        onChange={(e) =>
                          setField(
                            "capacity_kg",
                            parseFloat(e.target.value) || ""
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn-primary riders-form__submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                <Save size={16} />
                {mode === "create" ? "Dar de alta" : "Guardar cambios"}
              </button>
            </form>
          </div>
        </aside>

        {/* ── RIGHT: Riders list ──────────────────────────── */}
        <div className="riders-list-panel">
          {isLoading ? (
            <div className="riders-state riders-state--loading">
              <Clock className="riders-state__spinner" size={32} />
              <p>Cargando flota de choferes...</p>
            </div>
          ) : isError ? (
            <div className="riders-state riders-state--error">
              <AlertTriangle size={32} />
              <p>Error al cargar los conductores.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => refetch()}
              >
                Reintentar
              </button>
            </div>
          ) : riders.length === 0 ? (
            <div className="riders-state riders-state--empty">
              <Truck size={48} />
              <h3>No hay conductores registrados</h3>
              <p>
                Usá el formulario de la izquierda para dar de alta a tu primer
                chofer.
              </p>
            </div>
          ) : (
            <div className="riders-table-wrap">
              <table className="riders-table">
                <thead>
                  <tr>
                    <th>Chofer</th>
                    <th>Contacto</th>
                    <th>Vehículo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map((r) => {
                    const v = r.vehicle ?? r.vehicles?.[0];
                    return (
                      <tr
                        key={r.id}
                        className={
                          editingId === r.id ? "riders-table__row--editing" : ""
                        }
                      >
                        <td>
                          <div className="rider-table-name">
                            <div className="rider-table-avatar">
                              <User size={16} />
                            </div>
                            <div>
                              <span className="rider-table-fullname">
                                {r.first_name} {r.last_name}
                              </span>
                              {r.dni && (
                                <span className="rider-table-dni">
                                  DNI: {r.dni}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="rider-table-contact">
                            {r.email && (
                              <span>
                                <Mail size={12} />
                                {r.email}
                              </span>
                            )}
                            {r.phone && (
                              <span>
                                <Phone size={12} />
                                {r.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {v ? (
                            <div className="rider-table-vehicle">
                              <Car size={13} />
                              <span>
                                {VEHICLE_LABELS[v.vehicle_type] ??
                                  v.vehicle_type}
                                {v.license_plate
                                  ? ` — ${v.license_plate}`
                                  : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="rider-table-no-vehicle">
                              Sin vehículo
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`rider-status-pill rider-status-pill--${r.status ?? "active"}`}
                          >
                            {r.status === "on_trip"
                              ? "En viaje"
                              : r.status === "inactive"
                                ? "Inactivo"
                                : "Activo"}
                          </span>
                        </td>
                        <td>
                          <div className="rider-table-actions">
                            <button
                              type="button"
                              className="rider-action-btn rider-action-btn--edit"
                              title="Editar"
                              onClick={() => startEdit(r)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="rider-action-btn rider-action-btn--docs"
                              title="Documentación"
                              onClick={() => setDocsRider(r)}
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              type="button"
                              className="rider-action-btn rider-action-btn--delete"
                              title="Dar de baja"
                              onClick={() => setDeleteTarget(r)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Documents Modal ──────────────────────────────── */}
      {docsRider && (
        <Modal
          isOpen={Boolean(docsRider)}
          onClose={() => {
            setDocsRider(null);
            setAddDocOpen(false);
          }}
          title={`Documentación — ${docsRider.first_name} ${docsRider.last_name}`}
        >
          <div className="rider-docs-modal">
            <p className="rider-docs-modal__info">
              Requisitos reglamentarios vigentes para circulación y transporte.
            </p>

            <button
              type="button"
              className="btn-secondary rider-docs-modal__upload-btn"
              onClick={() => setAddDocOpen((v) => !v)}
            >
              <Upload size={15} />
              {addDocOpen ? "Cancelar" : "Subir documento"}
            </button>

            {addDocOpen && (
              <div className="rider-doc-upload-form">
                <div className="riders-form__group">
                  <label className="riders-form__label">Tipo de Documento</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {REQUIRED_DOCS.map((d) => (
                      <option key={d.type} value={d.type}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="riders-form__group">
                  <label className="riders-form__label">
                    Archivo (PDF, imagen)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    ref={docFileRef}
                  />
                </div>
                <div className="riders-form__group">
                  <label className="riders-form__label">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={uploadingDoc}
                  onClick={handleDocUpload}
                >
                  {uploadingDoc ? "Subiendo..." : "Confirmar subida"}
                </button>
              </div>
            )}

            {isLoadingDocs ? (
              <p>Cargando documentos...</p>
            ) : (
              <div className="docs-list">
                {REQUIRED_DOCS.map((req) => {
                  const uploaded = riderDocs.find(
                    (d) => d.document_type === req.type
                  );
                  const statusInfo = uploaded
                    ? getDocStatus(uploaded.expires_at)
                    : { label: "Falta presentar", color: "red" };

                  return (
                    <div key={req.type} className="doc-item">
                      <div className="doc-item__info">
                        <FileText size={18} className="doc-item__icon" />
                        <div>
                          <span className="doc-item__name">{req.label}</span>
                          {uploaded?.expires_at && (
                            <span className="doc-item__expiry">
                              Vence:{" "}
                              {new Date(uploaded.expires_at).toLocaleDateString(
                                "es-AR"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`doc-status-badge doc-status-badge--${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────── */}
      {deleteTarget && (
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Confirmar Baja"
        >
          <div className="rider-delete-confirm">
            <AlertTriangle size={36} className="rider-delete-confirm__icon" />
            <p>
              ¿Estás seguro que querés dar de baja a{" "}
              <strong>
                {deleteTarget.first_name} {deleteTarget.last_name}
              </strong>
              ? El rider quedará inactivo.
            </p>
            <div className="rider-delete-confirm__actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary btn-primary--danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                <Trash2 size={16} />
                Sí, dar de baja
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
