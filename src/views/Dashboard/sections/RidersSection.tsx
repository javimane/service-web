"use client";

import React, { useState, useEffect } from "react";
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
  ShieldAlert,
} from "lucide-react";
import {
  commerceService,
  RiderEmployee,
  RiderVehicle,
  RiderDocument,
} from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import "./RidersSection.css";

const REQUIRED_DOCS = [
  { type: "driving_license", label: "Licencia de Conducir" },
  { type: "vehicle_registration", label: "Cédula del Vehículo" },
  { type: "insurance", label: "Póliza de Seguro al Día" },
  { type: "vtv_rto", label: "VTV / RTO Vigente" },
  { type: "criminal_record", label: "Certificado de Antecedentes Penales" },
];

export default function RidersSection() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  const [addRiderModalOpen, setAddRiderModalOpen] = useState(false);
  const [selectedRiderForDocs, setSelectedRiderForDocs] = useState<RiderEmployee | null>(null);
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);

  // New Rider Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [licensePlate, setLicensePlate] = useState("");
  const [capacityKg, setCapacityKg] = useState<number | "">("");

  // New Doc Form
  const [docType, setDocType] = useState("driving_license");
  const [docFileName, setDocFileName] = useState("");
  const [docStoragePath, setDocStoragePath] = useState("");
  const [docExpiresAt, setDocExpiresAt] = useState("");

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
    queryKey: ["rider-documents", selectedRiderForDocs?.id],
    queryFn: () =>
      selectedRiderForDocs
        ? commerceService.documents(selectedRiderForDocs.id)
        : Promise.resolve([]),
    enabled: Boolean(selectedRiderForDocs),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async () => {
      // 1. Create employee
      const employee = await commerceService.createEmployee({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        dni: dni.trim(),
        status: "active",
      });

      // 2. Create vehicle if entered
      if (employee.id && licensePlate.trim()) {
        await commerceService.createVehicle(employee.id, {
          vehicle_type: vehicleType,
          brand: brand.trim() || undefined,
          model: model.trim() || undefined,
          year: typeof year === "number" ? year : undefined,
          license_plate: licensePlate.trim(),
          capacity_kg: typeof capacityKg === "number" ? capacityKg : undefined,
          is_active: true,
        });
      }
      return employee;
    },
    onSuccess: () => {
      showSuccess("Rider registrado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      setAddRiderModalOpen(false);
      resetRiderForm();
    },
    onError: () => showError("Error al dar de alta al rider."),
  });

  const createDocMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRiderForDocs) return;
      return commerceService.createDocument(selectedRiderForDocs.id, {
        document_type: docType,
        storage_path: docStoragePath.trim() || `riders/${docType}_${Date.now()}.pdf`,
        file_name: docFileName.trim() || `${docType}.pdf`,
        expires_at: docExpiresAt || undefined,
      });
    },
    onSuccess: () => {
      showSuccess("Documento cargado correctamente.");
      refetchDocs();
      setAddDocModalOpen(false);
    },
    onError: () => showError("No se pudo cargar el documento."),
  });

  const resetRiderForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setDni("");
    setVehicleType("motorcycle");
    setBrand("");
    setModel("");
    setYear("");
    setLicensePlate("");
    setCapacityKg("");
  };

  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  const getDocStatus = (expiresAt?: string | null) => {
    if (!expiresAt) return { label: "Sin vencimiento", color: "green" };
    if (!currentTime) return { label: "Vigente", color: "green" };
    const exp = new Date(expiresAt).getTime();
    const daysLeft = (exp - currentTime) / (1000 * 60 * 60 * 24);

    if (daysLeft < 0) {
      return { label: "Vencido", color: "red" };
    }
    if (daysLeft <= 30) {
      return { label: `Vence en ${Math.ceil(daysLeft)} días`, color: "amber" };
    }
    return { label: "Al día", color: "green" };
  };

  const getVehicleTypeLabel = (type?: string) => {
    switch (type) {
      case "motorcycle":
        return "Moto";
      case "car":
        return "Auto";
      case "pickup":
        return "Camioneta";
      case "van":
        return "Furgón";
      case "truck":
        return "Camión";
      default:
        return type || "Vehículo";
    }
  };

  return (
    <div className="riders-section">
      <header className="riders-section__header">
        <div>
          <span className="riders-section__subtitle">Gestión de Logística</span>
          <h1 className="riders-section__title">Riders y Fleteros</h1>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setAddRiderModalOpen(true)}
        >
          <Plus size={18} />
          <span>Agregar rider / fletero</span>
        </button>
      </header>

      {/* Grid or States */}
      {isLoading ? (
        <div className="riders-state riders-state--loading">
          <Clock className="riders-state__spinner" size={32} />
          <p>Cargando flota de choferes...</p>
        </div>
      ) : isError ? (
        <div className="riders-state riders-state--error">
          <AlertTriangle size={32} />
          <p>Error al cargar los conductores de la flota.</p>
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : riders.length === 0 ? (
        <div className="riders-state riders-state--empty">
          <Truck size={48} />
          <h3>No tenés conductores registrados</h3>
          <p>
            Da de alta a tus choferes y fleteros con sus vehículos y documentación
            reglamentaria para asignarlos a viajes de entrega.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setAddRiderModalOpen(true)}
          >
            <Plus size={18} />
            <span>Dar de alta primer chofer</span>
          </button>
        </div>
      ) : (
        <div className="riders-grid">
          {riders.map((r) => {
            const v = r.vehicle || (r.vehicles && r.vehicles[0]);
            return (
              <div key={r.id} className="rider-card">
                <div className="rider-card__header">
                  <div className="rider-avatar">
                    <User size={22} />
                  </div>
                  <div className="rider-info">
                    <h3 className="rider-name">
                      {r.first_name} {r.last_name}
                    </h3>
                    <span className="rider-dni">DNI: {r.dni || "—"}</span>
                  </div>
                  <span
                    className={`rider-status-pill rider-status-pill--${
                      r.status || "active"
                    }`}
                  >
                    {r.status === "on_trip"
                      ? "En viaje"
                      : r.status === "inactive"
                      ? "Inactivo"
                      : "Activo"}
                  </span>
                </div>

                <div className="rider-card__details">
                  <div className="rider-detail-item">
                    <Phone size={14} />
                    <span>{r.phone || "No informado"}</span>
                  </div>
                  <div className="rider-detail-item">
                    <Mail size={14} />
                    <span>{r.email || "No informado"}</span>
                  </div>
                  <div className="rider-detail-item">
                    <Car size={14} />
                    <span>
                      {getVehicleTypeLabel(v?.vehicle_type)}
                      {v?.license_plate ? ` • ${v.license_plate}` : ""}
                      {v?.brand ? ` (${v.brand} ${v.model || ""})` : ""}
                    </span>
                  </div>
                </div>

                <div className="rider-card__footer">
                  <button
                    type="button"
                    className="btn-secondary rider-doc-btn"
                    onClick={() => setSelectedRiderForDocs(r)}
                  >
                    <FileText size={16} />
                    <span>Documentación</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Rider Modal */}
      {addRiderModalOpen && (
        <Modal
          isOpen={addRiderModalOpen}
          onClose={() => setAddRiderModalOpen(false)}
          title="Alta de Rider / Fletero"
        >
          <form
            className="rider-modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              createEmployeeMutation.mutate();
            }}
          >
            <h4 className="rider-form-subtitle">Datos Personales y Acceso</h4>
            <div className="rider-form-row">
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Nombre*</label>
                <input
                  type="text"
                  required
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Apellido*</label>
                <input
                  type="text"
                  required
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="rider-form-row">
              <div className="rider-form-group flex-1">
                <label className="commercial-label">DNI*</label>
                <input
                  type="text"
                  required
                  placeholder="38123456"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Teléfono Móvil*</label>
                <input
                  type="tel"
                  required
                  placeholder="+54 9 11 1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="rider-form-row">
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Email de Acceso App*</label>
                <input
                  type="email"
                  required
                  placeholder="chofer@miempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Contraseña Inicial*</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <h4 className="rider-form-subtitle">Vehículo Asignado</h4>
            <div className="rider-form-row">
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Tipo de Vehículo*</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="motorcycle">Moto</option>
                  <option value="car">Automóvil</option>
                  <option value="pickup">Camioneta</option>
                  <option value="van">Furgón</option>
                  <option value="truck">Camión</option>
                </select>
              </div>
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Patente / Dominio*</label>
                <input
                  type="text"
                  placeholder="AF123JK"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="rider-form-row">
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Marca y Modelo</label>
                <input
                  type="text"
                  placeholder="Honda XR 250"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="rider-form-group flex-1">
                <label className="commercial-label">Capacidad de Carga (kg)</label>
                <input
                  type="number"
                  placeholder="30"
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(parseFloat(e.target.value) || "")}
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAddRiderModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createEmployeeMutation.isPending}
              >
                Dar de alta chofer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Documents Modal */}
      {selectedRiderForDocs && (
        <Modal
          isOpen={Boolean(selectedRiderForDocs)}
          onClose={() => setSelectedRiderForDocs(null)}
          title={`Documentación — ${selectedRiderForDocs.first_name} ${selectedRiderForDocs.last_name}`}
        >
          <div className="rider-docs-modal">
            <div className="rider-docs-header">
              <p>Requisitos reglamentarios vigentes para circulación y transporte.</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAddDocModalOpen(true)}
              >
                <Upload size={16} />
                <span>Subir documento</span>
              </button>
            </div>

            {isLoadingDocs ? (
              <p>Cargando documentos...</p>
            ) : (
              <div className="docs-list">
                {REQUIRED_DOCS.map((req) => {
                  const uploaded = riderDocs.find((d) => d.document_type === req.type);
                  const statusInfo = uploaded
                    ? getDocStatus(uploaded.expires_at)
                    : { label: "Falta presentar", color: "red" };

                  return (
                    <div key={req.type} className="doc-item">
                      <div className="doc-item__info">
                        <FileText size={18} className="doc-item__icon" />
                        <div>
                          <span className="doc-item__name">{req.label}</span>
                          {uploaded && uploaded.expires_at && (
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

      {/* Add Document Modal */}
      {addDocModalOpen && (
        <Modal
          isOpen={addDocModalOpen}
          onClose={() => setAddDocModalOpen(false)}
          title="Cargar Documento"
        >
          <form
            className="rider-modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              createDocMutation.mutate();
            }}
          >
            <div className="rider-form-group">
              <label className="commercial-label">Tipo de Documento*</label>
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

            <div className="rider-form-group">
              <label className="commercial-label">Nombre del archivo o URL*</label>
              <input
                type="text"
                required
                placeholder="licencia_frente.pdf"
                value={docFileName}
                onChange={(e) => setDocFileName(e.target.value)}
              />
            </div>

            <div className="rider-form-group">
              <label className="commercial-label">Fecha de Vencimiento</label>
              <input
                type="date"
                value={docExpiresAt}
                onChange={(e) => setDocExpiresAt(e.target.value)}
              />
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAddDocModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createDocMutation.isPending}
              >
                Guardar documento
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
