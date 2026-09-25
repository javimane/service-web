"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, FileText, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { useAlert } from "@/context/AlertContext";
import { commerceService, FleetVehicle } from "@/services/commerceService";
import { compressDocumentImage } from "@/services/storageUploads";
import "./FleetVehiclesPanel.css";

const VEHICLE_TYPES = [
  ["bicycle", "Bicicleta"],
  ["motorcycle", "Moto"],
  ["car", "Auto"],
  ["pickup", "Camioneta"],
  ["van", "Furgón"],
  ["truck", "Camión"],
] as const;

const DOCUMENT_TYPES = [
  ["vehicle_registration", "Cédula del vehículo"],
  ["insurance", "Seguro"],
] as const;

const EMPTY_VEHICLE = {
  vehicle_type: "motorcycle",
  brand: "",
  model: "",
  year: "",
  license_plate: "",
  capacity_kg: "",
};

export default function FleetVehiclesPanel() {
  const { showSuccess, showError } = useAlert();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_VEHICLE);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FleetVehicle | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [documentType, setDocumentType] = useState("vehicle_registration");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { data: vehicles = [], isLoading } = useQuery<FleetVehicle[]>({
    queryKey: ["fleet-vehicles"],
    queryFn: commerceService.fleetVehicles,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const vehicle = {
        vehicle_type: form.vehicle_type,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
        license_plate: form.license_plate.trim().toUpperCase() || undefined,
        capacity_kg: form.capacity_kg ? Number(form.capacity_kg) : undefined,
      };
      return editingVehicleId
        ? commerceService.updateFleetVehicle(editingVehicleId, vehicle)
        : commerceService.createFleetVehicle(vehicle);
    },
    onSuccess: () => {
      const wasEditing = Boolean(editingVehicleId);
      setForm(EMPTY_VEHICLE);
      setEditingVehicleId(null);
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      showSuccess(wasEditing
        ? "Datos del vehículo actualizados."
        : form.vehicle_type === "bicycle"
          ? "Bicicleta agregada a la flota. No requiere documentación."
          : "Vehículo agregado a la flota. Subí su cédula para habilitarlo.");
    },
    onError: (error: Error) =>
      showError(error.message || "No se pudo guardar el vehículo."),
  });

  const deleteMutation = useMutation({
    mutationFn: commerceService.deleteFleetVehicle,
    onSuccess: (_, vehicleId) => {
      if (editingVehicleId === vehicleId) {
        setEditingVehicleId(null);
        setForm(EMPTY_VEHICLE);
      }
      if (selectedVehicleId === vehicleId) setSelectedVehicleId(null);
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      showSuccess("Vehículo y documentos de la empresa eliminados.");
    },
    onError: (error: Error) =>
      showError(error.message || "No se pudo eliminar el vehículo."),
  });

  const startEditing = (vehicle: FleetVehicle) => {
    setEditingVehicleId(vehicle.id);
    setForm({
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand ?? "",
      model: vehicle.model ?? "",
      year: vehicle.year?.toString() ?? "",
      license_plate: vehicle.license_plate ?? "",
      capacity_kg: vehicle.capacity_kg?.toString() ?? "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const uploadDocument = async () => {
    const originalFile = fileRef.current?.files?.[0];
    if (!selectedVehicleId || !originalFile) {
      showError("Seleccioná un archivo.");
      return;
    }
    setUploading(true);
    try {
      const file = await compressDocumentImage(originalFile);
      const { signedUrl, storage_path } =
        await commerceService.createFleetDocumentUploadUrl(
          selectedVehicleId,
          file.name,
        );
      const response = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!response.ok) throw new Error("No se pudo subir el archivo.");
      await commerceService.createFleetDocument(selectedVehicleId, {
        document_type: documentType,
        storage_path,
        file_name: file.name,
        mime_type: file.type,
        expires_at: expiresAt || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
      setSelectedVehicleId(null);
      setExpiresAt("");
      if (fileRef.current) fileRef.current.value = "";
      showSuccess("Documento del vehículo guardado.");
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "No se pudo subir el documento.",
      );
      void queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["logistics-employees"] });
    } finally {
      setUploading(false);
    }
  };

  const hasRegistration = (vehicle: FleetVehicle) =>
    vehicle.vehicle_type === "bicycle" || Boolean(vehicle.documents?.some(
      (document) =>
        document.document_type === "vehicle_registration" &&
        (!document.expires_at ||
          document.expires_at >= new Date().toISOString().slice(0, 10)),
    ));

  return (
    <section
      className="fleet-vehicles-panel"
      aria-labelledby="fleet-vehicles-title"
    >
      <div className="fleet-vehicles-panel__heading">
        <Car size={22} aria-hidden="true" />
        <div>
          <h2 id="fleet-vehicles-title">Vehículos de la empresa</h2>
          <p>
            Cargá cada vehículo y sus documentos una sola vez. Después asignalo
            a un rider.
          </p>
        </div>
      </div>

      <form
        ref={formRef}
        className="fleet-vehicles-panel__form"
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate();
        }}
      >
        {editingVehicleId && (
          <p className="fleet-vehicles-panel__edit-heading">
            Editando vehículo de la empresa
          </p>
        )}
        <label>
          Tipo
          <select
            value={form.vehicle_type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                vehicle_type: event.target.value,
              }))
            }
          >
            {VEHICLE_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Marca
          <input
            required={form.vehicle_type !== "bicycle"}
            value={form.brand}
            onChange={(event) =>
              setForm((current) => ({ ...current, brand: event.target.value }))
            }
            placeholder="Honda"
          />
        </label>
        <label>
          Modelo
          <input
            required={form.vehicle_type !== "bicycle"}
            value={form.model}
            onChange={(event) =>
              setForm((current) => ({ ...current, model: event.target.value }))
            }
            placeholder="XR 250"
          />
        </label>
        <label>
          Año
          <input
            required={form.vehicle_type !== "bicycle"}
            type="number"
            min={1900}
            max={2100}
            value={form.year}
            onChange={(event) =>
              setForm((current) => ({ ...current, year: event.target.value }))
            }
            placeholder="2024"
          />
        </label>
        <label>
          Patente
          <input
            required={form.vehicle_type !== "bicycle"}
            value={form.license_plate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                license_plate: event.target.value,
              }))
            }
            placeholder="AB123CD"
          />
        </label>
        <label>
          Capacidad (kg)
          <input
            type="number"
            min={0}
            step={1}
            value={form.capacity_kg}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                capacity_kg: event.target.value,
              }))
            }
            placeholder="30"
          />
        </label>
        <button data-action-tone="add"
          className="btn-primary"
          type="submit"
          disabled={saveMutation.isPending}
        >
          {editingVehicleId ? <Pencil size={16} /> : <Plus size={16} />}
          {saveMutation.isPending
            ? "Guardando..."
            : editingVehicleId
              ? "Guardar cambios"
              : "Agregar vehículo"}
        </button>
        {editingVehicleId && (
          <button data-action-tone="cancel"
            className="fleet-vehicles-panel__cancel-button"
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => {
              setEditingVehicleId(null);
              setForm(EMPTY_VEHICLE);
            }}
          >
            <X size={16} /> Cancelar
          </button>
        )}
      </form>

      <div className="fleet-vehicles-panel__list">
        {isLoading ? (
          <p>Cargando vehículos...</p>
        ) : vehicles.length === 0 ? (
          <p>Todavía no hay vehículos en la flota.</p>
        ) : (
          vehicles.map((vehicle) => (
            <div className="fleet-vehicles-panel__item" key={vehicle.id}>
              <div className="fleet-vehicles-panel__vehicle">
                <strong>
                  {VEHICLE_TYPES.find(
                    ([type]) => type === vehicle.vehicle_type,
                  )?.[1] ?? vehicle.vehicle_type}{" "}
                  · {vehicle.brand} {vehicle.model}
                </strong>
                <span>
                  {vehicle.license_plate || "Sin patente"}
                  {vehicle.year ? ` · ${vehicle.year}` : ""}
                  {vehicle.capacity_kg != null
                    ? ` · ${vehicle.capacity_kg} kg`
                    : ""}
                </span>
                <span
                  className={
                    hasRegistration(vehicle)
                      ? "fleet-vehicles-panel__ready"
                      : "fleet-vehicles-panel__pending"
                  }
                >
                  {hasRegistration(vehicle)
                    ? vehicle.vehicle_type === "bicycle" ? "No requiere documentación" : "Cédula cargada"
                    : "Falta la cédula del vehículo"}
                </span>
              </div>
              <div className="fleet-vehicles-panel__actions">
                <button
                  type="button"
                  className="fleet-vehicles-panel__edit-button"
                  disabled={saveMutation.isPending}
                  onClick={() => startEditing(vehicle)}
                >
                  <Pencil size={16} /> Editar
                </button>
                <button
                  type="button"
                  className="fleet-vehicles-panel__document-button"
                  onClick={() =>
                    setSelectedVehicleId(
                      selectedVehicleId === vehicle.id ? null : vehicle.id,
                    )
                  }
                >
                  <FileText size={16} /> Documentos
                </button>
                <button
                  type="button"
                  className="fleet-vehicles-panel__delete-button"
                  disabled={saveMutation.isPending || deleteMutation.isPending || uploading}
                  onClick={() => setDeleteTarget(vehicle)}
                  aria-label={`Eliminar vehículo ${vehicle.brand || ""} ${vehicle.model || ""} ${vehicle.license_plate || ""}`.trim()}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
              {selectedVehicleId === vehicle.id && (
                <div className="fleet-vehicles-panel__documents">
                  <ul>
                    {vehicle.documents?.map((document) => (
                      <li key={document.id}>
                        {DOCUMENT_TYPES.find(
                          ([type]) => type === document.document_type,
                        )?.[1] ?? document.document_type}
                        {document.expires_at
                          ? ` · vence ${document.expires_at}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    aria-label="Tipo de documento del vehículo"
                  >
                    {DOCUMENT_TYPES.map(([type, label]) => (
                      <option key={type} value={type}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    aria-label="Archivo del documento"
                  />
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    aria-label="Vencimiento del documento"
                  />
                  <button data-action-tone="upload"
                    type="button"
                    className="btn-primary"
                    disabled={uploading}
                    onClick={uploadDocument}
                  >
                    <Upload size={16} />{" "}
                    {uploading
                      ? "Subiendo..."
                      : vehicle.documents?.some(
                            (document) => document.document_type === documentType,
                          )
                        ? "Reemplazar documento"
                        : "Subir documento"}
                  </button>
                  {vehicle.documents?.some(
                    (document) => document.document_type === documentType,
                  ) && (
                    <p className="fleet-vehicles-panel__replace-hint">
                      El archivo anterior se borrará al guardar el nuevo.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => {
            if (!deleteMutation.isPending) setDeleteTarget(null);
          }}
          title="Eliminar vehículo de la empresa"
        >
          <div className="fleet-vehicles-panel__delete-confirm">
            <p>
              ¿Querés eliminar <strong>{deleteTarget.brand} {deleteTarget.model} {deleteTarget.license_plate}</strong>
              ? También se borrarán sus documentos. Si está asignado a un rider,
              quedará sin ese vehículo y deberá volver a verificarse.
            </p>
            <div className="fleet-vehicles-panel__delete-actions">
              <button
                type="button"
                data-action-tone="cancel"
                className="fleet-vehicles-panel__cancel-button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="fleet-vehicles-panel__confirm-delete"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                <Trash2 size={16} />
                {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
