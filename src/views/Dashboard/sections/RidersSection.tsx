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
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import {
  commerceService,
  RiderEmployee,
  RiderDocument,
} from "@/services/commerceService";
import FleetVehiclesPanel from "./FleetVehiclesPanel";
import { useAlert } from "@/context/AlertContext";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import { compressDocumentImage } from "@/services/storageUploads";
import Modal from "@/components/Modal/Modal";
import "./RidersSection.css";

/* ─── Types ─────────────────────────────────────────────── */
type FormMode = "create" | "edit";

interface RiderForm {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  phone: string;
  dni: string;
}

const EMPTY_FORM: RiderForm = {
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  phone: "",
  dni: "",
};

interface OwnVehicleForm {
  vehicle_type: string;
  brand: string;
  model: string;
  year: string;
  license_plate: string;
  capacity_kg: string;
}

const EMPTY_OWN_VEHICLE: OwnVehicleForm = {
  vehicle_type: "motorcycle",
  brand: "",
  model: "",
  year: "",
  license_plate: "",
  capacity_kg: "",
};

const REQUIRED_DOCS = [
  { type: "driving_license", label: "Licencia de Conducir" },
  { type: "criminal_record", label: "Certificado de Antecedentes Penales" },
];
const OWN_VEHICLE_DOC = {
  type: "vehicle_registration",
  label: "Cédula del vehículo propio",
};

const VEHICLE_LABELS: Record<string, string> = {
  bicycle: "Bicicleta",
  motorcycle: "Moto",
  car: "Automóvil",
  pickup: "Camioneta",
  van: "Furgón",
  truck: "Camión",
};

const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pendiente de revisión",
  under_review: "En revisión",
  verified: "Verificado",
  rejected: "Rechazado",
};

const RIDER_STATUS_LABELS = {
  active: "Activo",
  on_trip: "En viaje",
  inactive: "Inactivo",
  pending: "Pendiente",
  paused: "Pausado",
  blocked: "Bloqueado",
} as const;

const DOCUMENT_LABELS: Record<string, string> = {
  driving_license: "Licencia de conducir",
  criminal_record: "Antecedentes penales",
  vehicle_registration: "Cédula del vehículo",
  insurance: "Seguro",
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
  const [assignedVehicleId, setAssignedVehicleId] = useState("");
  const [ownVehicle, setOwnVehicle] =
    useState<OwnVehicleForm>(EMPTY_OWN_VEHICLE);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    isFetching,
    isError,
    refetch,
  } = useQuery<RiderEmployee[]>({
    queryKey: ["logistics-employees"],
    queryFn: () => commerceService.employees(),
  });

  const { data: fleetVehicles = [] } = useQuery({
    queryKey: ["fleet-vehicles"],
    queryFn: commerceService.fleetVehicles,
  });
  const currentDocsRider = docsRider
    ? (riders.find((rider) => rider.id === docsRider.id) ?? docsRider)
    : null;
  const requiredDocs =
    (docsRider?.vehicle ?? docsRider?.own_vehicle)?.vehicle_type === "bicycle"
      ? []
      : docsRider?.own_vehicle_id
        ? [...REQUIRED_DOCS, OWN_VEHICLE_DOC]
        : REQUIRED_DOCS;

  const ownVehiclePayload = () => ({
    vehicle_type: ownVehicle.vehicle_type,
    brand: ownVehicle.brand.trim(),
    model: ownVehicle.model.trim(),
    year: ownVehicle.year ? Number(ownVehicle.year) : undefined,
    license_plate: ownVehicle.license_plate.trim().toUpperCase() || undefined,
    capacity_kg: ownVehicle.capacity_kg
      ? Number(ownVehicle.capacity_kg)
      : undefined,
  });

  const {
    data: riderDocs = [],
    refetch: refetchDocs,
    isLoading: isLoadingDocs,
  } = useQuery<RiderDocument[]>({
    queryKey: ["rider-documents", docsRider?.id],
    queryFn: () =>
      docsRider ? commerceService.documents(docsRider.id) : Promise.resolve([]),
    enabled: Boolean(docsRider),
  });
  const isReplacingDocument = riderDocs.some(
    (document) =>
      document.document_type === docType &&
      (docType === "vehicle_registration" || docType === "insurance"
        ? document.rider_vehicle_id === currentDocsRider?.own_vehicle_id
        : !document.rider_vehicle_id),
  );

  /* ─── Mutations ───────────────────────────────────────── */
  const createMutation = useMutation({
    mutationFn: async () => {
      const employee = await commerceService.createEmployee({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password.trim(),
        phone: form.phone.trim() || undefined,
        dni: form.dni.trim() || undefined,
      });

      if (employee.id && assignedVehicleId === "own") {
        await commerceService.setOwnVehicle(employee.id, ownVehiclePayload());
      } else if (employee.id && assignedVehicleId) {
        await commerceService.assignFleetVehicle(
          employee.id,
          assignedVehicleId,
        );
      }
      return employee;
    },
    onSuccess: () => {
      showSuccess("Rider registrado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
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
      const existingRider = riders.find((rider) => rider.id === editingId);
      if (assignedVehicleId === "own") {
        await commerceService.setOwnVehicle(editingId, ownVehiclePayload());
      } else if (
        (existingRider?.fleet_vehicle_id ??
          (existingRider?.own_vehicle_id ? "own" : "")) !== assignedVehicleId
      ) {
        await commerceService.assignFleetVehicle(
          editingId,
          assignedVehicleId || null,
        );
      }
      if (changePassword && newPassword.length >= 6) {
        await commerceService.updateEmployeePassword(editingId, newPassword);
      }
    },
    onSuccess: () => {
      showSuccess("Datos del rider actualizados.");
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      resetForm();
    },
    onError: (e: any) =>
      showError(e?.message || "Error al actualizar el rider."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commerceService.deleteEmployee(id),
    onSuccess: () => {
      showSuccess("Rider y archivos eliminados correctamente.");
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      setDeleteTarget(null);
    },
    onError: (error: any) =>
      showError(error?.message || "Error al eliminar al rider."),
  });

  /* ─── Helpers ─────────────────────────────────────────── */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setAssignedVehicleId("");
    setOwnVehicle(EMPTY_OWN_VEHICLE);
    setMode("create");
    setEditingId(null);
    setChangePassword(false);
    setNewPassword("");
    setShowPassword(false);
  };

  const startEdit = (r: RiderEmployee) => {
    setMode("edit");
    setEditingId(r.id);
    setAssignedVehicleId(r.fleet_vehicle_id ?? (r.own_vehicle_id ? "own" : ""));
    setOwnVehicle(
      r.own_vehicle
        ? {
            vehicle_type: r.own_vehicle.vehicle_type,
            brand: r.own_vehicle.brand ?? "",
            model: r.own_vehicle.model ?? "",
            year: r.own_vehicle.year?.toString() ?? "",
            license_plate: r.own_vehicle.license_plate ?? "",
            capacity_kg: r.own_vehicle.capacity_kg?.toString() ?? "",
          }
        : EMPTY_OWN_VEHICLE,
    );
    setChangePassword(false);
    setNewPassword("");
    setShowPassword(false);
    setForm({
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
      username: r.username ?? r.email ?? "",
      password: "",
      phone: r.phone ?? "",
      dni: r.dni ?? "",
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

  const openDocument = async (documentId: string, fleetVehicleId?: string) => {
    if (!docsRider) return;
    const preview = window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    try {
      const { url } = fleetVehicleId
        ? await commerceService.fleetVehicleDocumentUrl(
            fleetVehicleId,
            documentId,
          )
        : await commerceService.riderDocumentUrl(docsRider.id, documentId);
      if (preview) preview.location.href = url;
      else window.location.href = url;
    } catch (error: any) {
      preview?.close();
      showError(error?.message || "No se pudo abrir el documento.");
    }
  };

  const handleRefresh = async () => {
    const [result] = await Promise.all([
      refetch(),
      docsRider ? refetchDocs() : Promise.resolve(),
    ]);
    if (result.isError)
      showError("No se pudieron actualizar los estados de los riders.");
  };

  /* ─── Document upload ─────────────────────────────────── */
  const handleDocUpload = async () => {
    if (!docsRider || !docFileRef.current?.files?.[0]) {
      showError("Seleccioná un archivo antes de subir.");
      return;
    }
    const originalFile = docFileRef.current.files[0];
    setUploadingDoc(true);
    try {
      const file = await compressDocumentImage(originalFile);
      const { signedUrl, storage_path } =
        await commerceService.createDocumentUploadUrl(docsRider.id, file.name);

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok) {
        throw new Error("No se pudo subir el archivo. Intentá nuevamente.");
      }

      await commerceService.createDocument(docsRider.id, {
        document_type: docType,
        storage_path,
        file_name: file.name,
        mime_type: file.type,
        expires_at: docExpiry || undefined,
      });

      showSuccess("Documento subido correctamente.");
      refetchDocs();
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      setAddDocOpen(false);
      setDocExpiry("");
      if (docFileRef.current) docFileRef.current.value = "";
    } catch (e: any) {
      showError(e?.message || "Error al subir el documento.");
      void refetchDocs();
      void queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
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
        <button
          type="button"
          className="riders-section__refresh"
          onClick={() => void handleRefresh()}
          disabled={isFetching}
          aria-label="Actualizar estados de los riders"
        >
          <RefreshCw
            size={18}
            className={isFetching ? "animate-spin" : ""}
            aria-hidden="true"
          />
          {isFetching ? "Actualizando..." : "Actualizar estados"}
        </button>
      </header>

      <FleetVehiclesPanel />

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
                  data-action-tone="cancel"
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
                  Nombre de usuario {mode === "create" ? "*" : ""}
                </label>
                <input
                  type="text"
                  required={mode === "create"}
                  disabled={mode === "edit"}
                  minLength={3}
                  maxLength={32}
                  pattern="[a-z][a-z0-9_-]{2,31}"
                  autoCapitalize="none"
                  autoComplete="username"
                  placeholder="juan_rider"
                  value={form.username}
                  onChange={(e) =>
                    setField("username", e.target.value.toLowerCase())
                  }
                />
                {mode === "create" && (
                  <span className="riders-form__hint">
                    De 3 a 32 caracteres: letras minúsculas, números, guion o
                    guion bajo. El rider usará este nombre para iniciar sesión.
                  </span>
                )}
                {mode === "edit" && (
                  <span className="riders-form__hint">
                    El nombre de usuario no puede cambiarse. Los riders
                    anteriores conservan su acceso por email.
                  </span>
                )}
              </div>

              {mode === "create" ? (
                <div className="riders-form__group">
                  <label
                    className="riders-form__label"
                    htmlFor="rider-initial-password"
                  >
                    Contraseña Inicial *
                  </label>
                  <div className="riders-form__password-field">
                    <input
                      id="rider-initial-password"
                      className="riders-form__password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="riders-form__password-toggle"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="riders-form__group">
                  <label className="riders-form__label riders-form__label--toggle">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => {
                        setChangePassword(e.target.checked);
                        setShowPassword(false);
                      }}
                    />
                    Cambiar contraseña
                  </label>
                  {changePassword && (
                    <div className="riders-form__password-field">
                      <input
                        className="riders-form__password-input"
                        type={showPassword ? "text" : "password"}
                        minLength={6}
                        required
                        autoComplete="new-password"
                        aria-label="Nueva contraseña"
                        placeholder="Nueva contraseña (mín. 6 caracteres)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="riders-form__password-toggle"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <h4 className="riders-form__subtitle">Vehículo del rider</h4>
              <div className="riders-form__group">
                <label
                  className="riders-form__label"
                  htmlFor="rider-assigned-vehicle"
                >
                  Modalidad de vehículo
                </label>
                <select
                  id="rider-assigned-vehicle"
                  value={assignedVehicleId}
                  onChange={(event) => setAssignedVehicleId(event.target.value)}
                >
                  <option value="">Sin vehículo asignado</option>
                  <option value="own">Vehículo propio del rider</option>
                  {fleetVehicles
                    .filter(
                      (vehicle) =>
                        vehicle.is_active &&
                        (!vehicle.assigned_rider_id ||
                          vehicle.assigned_rider_id === editingId),
                    )
                    .map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {VEHICLE_LABELS[vehicle.vehicle_type] ??
                          vehicle.vehicle_type}{" "}
                        · {vehicle.brand} {vehicle.model} ·{" "}
                        {vehicle.license_plate || "sin patente"}
                      </option>
                    ))}
                </select>
                <span className="riders-form__hint">
                  Los vehículos de la empresa se cargan en la flota. Para uno
                  propio, completá los datos del rider.
                </span>
              </div>

              {assignedVehicleId === "own" && (
                <div className="riders-form__own-vehicle">
                  <div className="riders-form__group">
                    <label
                      className="riders-form__label"
                      htmlFor="rider-own-type"
                    >
                      Tipo de vehículo
                    </label>
                    <select
                      id="rider-own-type"
                      value={ownVehicle.vehicle_type}
                      onChange={(event) =>
                        setOwnVehicle((value) => ({
                          ...value,
                          vehicle_type: event.target.value,
                        }))
                      }
                    >
                      {Object.entries(VEHICLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="riders-form__row">
                    <div className="riders-form__group">
                      <label
                        className="riders-form__label"
                        htmlFor="rider-own-brand"
                      >
                        Marca
                      </label>
                      <input
                        id="rider-own-brand"
                        required={ownVehicle.vehicle_type !== "bicycle"}
                        value={ownVehicle.brand}
                        onChange={(event) =>
                          setOwnVehicle((value) => ({
                            ...value,
                            brand: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="riders-form__group">
                      <label
                        className="riders-form__label"
                        htmlFor="rider-own-model"
                      >
                        Modelo
                      </label>
                      <input
                        id="rider-own-model"
                        required={ownVehicle.vehicle_type !== "bicycle"}
                        value={ownVehicle.model}
                        onChange={(event) =>
                          setOwnVehicle((value) => ({
                            ...value,
                            model: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="riders-form__row">
                    <div className="riders-form__group">
                      <label
                        className="riders-form__label"
                        htmlFor="rider-own-year"
                      >
                        Año
                      </label>
                      <input
                        id="rider-own-year"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        required={ownVehicle.vehicle_type !== "bicycle"}
                        value={ownVehicle.year}
                        onChange={(event) =>
                          setOwnVehicle((value) => ({
                            ...value,
                            year: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="riders-form__group">
                      <label
                        className="riders-form__label"
                        htmlFor="rider-own-plate"
                      >
                        Patente
                      </label>
                      <input
                        id="rider-own-plate"
                        required={ownVehicle.vehicle_type !== "bicycle"}
                        value={ownVehicle.license_plate}
                        onChange={(event) =>
                          setOwnVehicle((value) => ({
                            ...value,
                            license_plate: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="riders-form__group">
                    <label
                      className="riders-form__label"
                      htmlFor="rider-own-capacity"
                    >
                      Capacidad de carga (kg)
                    </label>
                    <input
                      id="rider-own-capacity"
                      type="number"
                      min="1"
                      step="1"
                      required={ownVehicle.vehicle_type !== "bicycle"}
                      value={ownVehicle.capacity_kg}
                      onChange={(event) =>
                        setOwnVehicle((value) => ({
                          ...value,
                          capacity_kg: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <p className="riders-form__hint">
                    {ownVehicle.vehicle_type === "bicycle"
                      ? "La bicicleta no requiere documentación."
                      : "La cédula de este vehículo se sube en la documentación del rider."}
                  </p>
                </div>
              )}

              <button
                data-action-tone="add"
                type="submit"
                className="btn-primary riders-form__submit"
                disabled={createMutation.isPending || updateMutation.isPending}
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
                    <th>Verificación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map((r) => {
                    const v = r.vehicle;
                    const missingDocs = r.activation?.missing_documents ?? [];
                    const needsSetup = !v || missingDocs.length > 0;
                    const verification = r.verification_status ?? "pending";
                    let status: keyof typeof RIDER_STATUS_LABELS;
                    if (r.is_blocked) status = "blocked";
                    else if (r.is_paused) status = "paused";
                    else if (r.status === "inactive") status = "inactive";
                    else if (needsSetup || verification !== "verified")
                      status = "pending";
                    else if (!r.activation?.is_active) status = "inactive";
                    else status = r.status === "on_trip" ? "on_trip" : "active";
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
                            {(r.username || r.email) && (
                              <span>
                                {r.username ? (
                                  <User size={12} />
                                ) : (
                                  <Mail size={12} />
                                )}
                                {r.username || r.email}
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
                                {v.license_plate ? ` — ${v.license_plate}` : ""}
                                {r.own_vehicle_id ? " · propio" : " · flota"}
                              </span>
                            </div>
                          ) : (
                            <div className="rider-table-vehicle-warning">
                              <span className="rider-table-no-vehicle">
                                Sin vehículo
                              </span>
                              <span
                                className="rider-table-vehicle-warning__message"
                                role="alert"
                              >
                                <AlertTriangle size={14} aria-hidden="true" />
                                Para estar activo, asigná un vehículo y subí la
                                documentación obligatoria.
                              </span>
                            </div>
                          )}
                          {v && missingDocs.length > 0 && (
                            <span
                              className="rider-table-vehicle-warning__message"
                              role="alert"
                            >
                              <AlertTriangle size={14} aria-hidden="true" />
                              Subí la documentación pendiente para enviar al
                              rider a revisión.
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`rider-verification-pill rider-verification-pill--${verification}`}
                          >
                            {VERIFICATION_LABELS[verification] ?? verification}
                          </span>
                          {r.verification_note && (
                            <span className="rider-verification-note">
                              {r.verification_note}
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`rider-status-pill rider-status-pill--${status}`}
                          >
                            {RIDER_STATUS_LABELS[status]}
                          </span>
                          {r.is_blocked && r.blocked_reason && (
                            <span className="rider-status-note rider-status-note--blocked">
                              <AlertTriangle size={14} aria-hidden="true" />
                              <span>
                                Motivo del bloqueo: {r.blocked_reason}
                              </span>
                            </span>
                          )}
                          {r.is_paused && r.paused_reason && (
                            <span className="rider-status-note rider-status-note--paused">
                              <AlertTriangle size={14} aria-hidden="true" />
                              <span>Motivo de la pausa: {r.paused_reason}</span>
                            </span>
                          )}
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
                              title="Eliminar rider"
                              aria-label={`Eliminar a ${r.first_name} ${r.last_name}`}
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
            <div className="rider-docs-modal__verification">
              <strong>
                Verificación:{" "}
                {VERIFICATION_LABELS[
                  currentDocsRider?.verification_status ?? "pending"
                ] ?? "Pendiente de revisión"}
              </strong>
              <span>
                La activación la realiza el equipo administrador después de
                revisar los datos y archivos.
              </span>
              {currentDocsRider?.verification_note && (
                <span>Observación: {currentDocsRider.verification_note}</span>
              )}
            </div>
            <p className="rider-docs-modal__info">
              {requiredDocs.length
                ? "Documentación necesaria para habilitar al rider."
                : "La bicicleta no requiere documentación."}
            </p>

            {requiredDocs.length > 0 && (
              <button
                data-action-tone={addDocOpen ? "cancel" : "upload"}
                type="button"
                className="btn-secondary rider-docs-modal__upload-btn"
                onClick={() => setAddDocOpen((v) => !v)}
              >
                <Upload size={15} />
                {addDocOpen ? "Cancelar" : "Subir documento"}
              </button>
            )}

            {addDocOpen && (
              <div className="rider-doc-upload-form">
                <div className="riders-form__group">
                  <label className="riders-form__label">
                    Tipo de Documento
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {requiredDocs.map((d) => (
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
                  data-action-tone="upload"
                  type="button"
                  className="btn-primary"
                  disabled={uploadingDoc}
                  onClick={handleDocUpload}
                >
                  {uploadingDoc
                    ? "Subiendo..."
                    : isReplacingDocument
                      ? "Reemplazar documento"
                      : "Confirmar subida"}
                </button>
                {isReplacingDocument && (
                  <p className="riders-form__hint">
                    El archivo anterior se borrará al guardar el nuevo.
                  </p>
                )}
              </div>
            )}

            {isLoadingDocs ? (
              <p>Cargando documentos...</p>
            ) : (
              <div className="docs-list">
                {requiredDocs.map((req) => {
                  const uploaded = riderDocs.find(
                    (d) =>
                      d.document_type === req.type &&
                      (req.type !== "vehicle_registration" ||
                        d.rider_vehicle_id === docsRider.own_vehicle_id),
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
                                "es-AR",
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
            {!isLoadingDocs && (
              <div className="rider-docs-modal__files">
                <h3>Archivos subidos</h3>
                {riderDocs.length === 0 && (
                  <p>Todavía no se subieron archivos del rider.</p>
                )}
                {riderDocs.map((document) => (
                  <div className="rider-docs-modal__file" key={document.id}>
                    <span>
                      {DOCUMENT_LABELS[document.document_type] ??
                        document.document_type}
                      : {document.file_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => openDocument(document.id)}
                    >
                      <Eye size={16} aria-hidden="true" /> Ver archivo
                    </button>
                  </div>
                ))}
                {fleetVehicles
                  .find((vehicle) => vehicle.id === docsRider.fleet_vehicle_id)
                  ?.documents.map((document) => (
                    <div
                      className="rider-docs-modal__file"
                      key={`fleet-${document.id}`}
                    >
                      <span>
                        {DOCUMENT_LABELS[document.document_type] ??
                          document.document_type}
                        : {document.file_name} (vehículo de la empresa)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          openDocument(
                            document.id,
                            docsRider.fleet_vehicle_id ?? undefined,
                          )
                        }
                      >
                        <Eye size={16} aria-hidden="true" /> Ver archivo
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────── */}
      {deleteTarget && (
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => {
            if (!deleteMutation.isPending) setDeleteTarget(null);
          }}
          title="Eliminar rider definitivamente"
        >
          <div className="rider-delete-confirm">
            <AlertTriangle size={36} className="rider-delete-confirm__icon" />
            <p>
              ¿Estás seguro que querés eliminar definitivamente a{" "}
              <strong>
                {deleteTarget.first_name} {deleteTarget.last_name}
              </strong>
              ? Se eliminarán su cuenta, su vehículo propio y los archivos de su
              documentación. Los vehículos de la flota seguirán disponibles.
            </p>
            <div className="rider-delete-confirm__actions">
              <button
                data-action-tone="cancel"
                type="button"
                className="btn-secondary"
                disabled={deleteMutation.isPending}
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
                Sí, eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
