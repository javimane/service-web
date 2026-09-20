"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { commerceService, Branch } from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import "./BranchesSection.css";

export default function BranchesSection() {
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();
  const { showSuccess, showError } = useAlert();

  const companyId = sessionStatus?.company_id || 1;

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [isPickupPoint, setIsPickupPoint] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [companyCoversShipping, setCompanyCoversShipping] = useState(false);
  const [lat, setLat] = useState<number | "">(-34.6037);
  const [lng, setLng] = useState<number | "">(-58.3816);

  const {
    data: rawBranches,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["merchant-branches", companyId],
    queryFn: () => commerceService.branches(companyId),
  });

  const branches: Branch[] = Array.isArray(rawBranches)
    ? rawBranches
    : Array.isArray((rawBranches as any)?.data)
      ? (rawBranches as any).data
      : Array.isArray((rawBranches as any)?.items)
        ? (rawBranches as any).items
        : [];

  const toggleOpenMutation = useMutation({
    mutationFn: ({ id, is_open }: { id: string; is_open: boolean }) =>
      commerceService.updateBranch(id, { is_open }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["merchant-branches"] });
      showSuccess(
        vars.is_open
          ? "Sucursal abierta. Ahora puede recibir pedidos."
          : "Sucursal cerrada temporalmente.",
      );
    },
    onError: () => showError("No se pudo actualizar el estado de la sucursal."),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Branch>) => {
      if (editingBranch) {
        return commerceService.updateBranch(editingBranch.id, data);
      }
      return commerceService.createBranch(data);
    },
    onSuccess: () => {
      showSuccess(
        editingBranch
          ? "Sucursal actualizada correctamente."
          : "Sucursal agregada con éxito.",
      );
      queryClient.invalidateQueries({ queryKey: ["merchant-branches"] });
      closeModal();
    },
    onError: () => showError("No se pudo guardar la sucursal."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commerceService.deleteBranch(id),
    onSuccess: () => {
      showSuccess("Sucursal eliminada.");
      queryClient.invalidateQueries({ queryKey: ["merchant-branches"] });
      setDeleteConfirmOpen(false);
      setBranchToDelete(null);
    },
    onError: () => showError("No se pudo eliminar la sucursal."),
  });

  const togglePickupMutation = useMutation({
    mutationFn: ({
      id,
      is_pickup_point,
    }: {
      id: string;
      is_pickup_point: boolean;
    }) => commerceService.updateBranch(id, { is_pickup_point }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-branches"] });
      showSuccess("Estado de punto de retiro actualizado.");
    },
    onError: () => showError("No se pudo cambiar el punto de retiro."),
  });

  const openAddModal = () => {
    setEditingBranch(null);
    setName("");
    setStreet("");
    setNumber("");
    setFloor("");
    setZipCode("");
    setPhone("");
    setOpeningHours("Lun a Vie 09:00 a 18:00 hs - Sáb 09:00 a 13:00 hs");
    setIsPickupPoint(true);
    setIsOpen(true);
    setCompanyCoversShipping(false);
    setLat(-34.6037);
    setLng(-58.3816);
    setModalOpen(true);
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setName(b.name);
    setStreet(b.street || "");
    setNumber(b.number || "");
    setFloor(b.floor || "");
    setZipCode(b.zip_code || "");
    setPhone(b.phone || "");
    setOpeningHours(b.opening_hours || "");
    setIsPickupPoint(b.is_pickup_point);
    setIsOpen(b.is_open ?? true);
    setCompanyCoversShipping(b.company_covers_shipping ?? false);
    setLat(b.lat ?? -34.6037);
    setLng(b.lng ?? -58.3816);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBranch(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError("El nombre de la sucursal es obligatorio.");
      return;
    }
    saveMutation.mutate({
      company_id: companyId,
      name: name.trim(),
      street: street.trim() || undefined,
      number: number.trim() || undefined,
      floor: floor.trim() || undefined,
      zip_code: zipCode.trim() || undefined,
      phone: phone.trim() || undefined,
      opening_hours: openingHours.trim() || undefined,
      is_pickup_point: isPickupPoint,
      is_open: isOpen,
      company_covers_shipping: companyCoversShipping,
      lat: typeof lat === "number" ? lat : undefined,
      lng: typeof lng === "number" ? lng : undefined,
    });
  };

  return (
    <div className="branches-section">
      <header className="branches-section__header">
        <div>
          <span className="branches-section__subtitle">Gestión Comercial</span>
          <h1 className="branches-section__title">
            Sucursales y Puntos de Retiro
          </h1>
        </div>
        <button
          type="button"
          className="branches-section__add-btn"
          onClick={openAddModal}
        >
          <span>Agregar sucursal</span>
        </button>
      </header>

      {/* List or States */}
      {isLoading ? (
        <div className="branches-state branches-state--loading">
          <Clock className="branches-state__spinner" size={32} />
          <p>Cargando sucursales...</p>
        </div>
      ) : isError ? (
        <div className="branches-state branches-state--error">
          <AlertCircle size={32} />
          <p>Error al obtener las sucursales.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : branches.length === 0 ? (
        <div className="branches-state branches-state--empty">
          <Store size={48} />
          <h3>No tenés sucursales registradas</h3>
          <p>
            Agregá tu casa central o puntos de venta físicos para habilitar el
            retiro en tienda para tus compradores.
          </p>
          <button
            type="button"
            className="branches-section__add-btn"
            onClick={openAddModal}
          >
            <Plus size={18} className="branches-section__add-icon" />
            <span>Crear primera sucursal</span>
          </button>
        </div>
      ) : (
        <div className="branches-grid">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`branch-card ${b.is_open === false ? "branch-card--closed" : ""}`}
            >
              {b.is_open === false && (
                <div className="branch-card__alert-closed" role="alert">
                  <AlertCircle size={16} />
                  <span>
                    ⚠️ Sucursal Cerrada - No se recibirán nuevos pedidos
                    inmediatos
                  </span>
                </div>
              )}

              <div className="branch-card__header">
                <div className="branch-card__title-row">
                  <div className="branch-card__icon">
                    <Store size={20} />
                  </div>
                  <div>
                    <div className="branch-card__title-line">
                      <h3 className="branch-card__name">{b.name}</h3>
                      <button
                        type="button"
                        className={`branch-status-pill ${
                          b.is_open !== false
                            ? "branch-status-pill--open"
                            : "branch-status-pill--closed"
                        }`}
                        title={
                          b.is_open !== false
                            ? "Click para cerrar sucursal"
                            : "Click para abrir sucursal"
                        }
                        onClick={() =>
                          toggleOpenMutation.mutate({
                            id: b.id,
                            is_open: b.is_open === false,
                          })
                        }
                      >
                        <span
                          className={`status-dot ${
                            b.is_open !== false
                              ? "status-dot--online"
                              : "status-dot--offline"
                          }`}
                        />
                        <span>
                          {b.is_open !== false ? "Abierta" : "Cerrada"}
                        </span>
                      </button>
                    </div>
                    <div className="branch-card__address">
                      <MapPin size={14} />
                      <span>
                        {b.street} {b.number}
                        {b.floor ? `, ${b.floor}` : ""}{" "}
                        {b.zip_code ? `(CP ${b.zip_code})` : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="branch-card__actions">
                  <button
                    type="button"
                    className="branch-icon-btn"
                    title="Editar"
                    onClick={() => openEditModal(b)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="branch-icon-btn branch-icon-btn--danger"
                    title="Eliminar"
                    onClick={() => {
                      setBranchToDelete(b);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="branch-card__body">
                {b.phone && (
                  <div className="branch-detail-row">
                    <Phone size={14} />
                    <span>{b.phone}</span>
                  </div>
                )}
                {b.opening_hours && (
                  <div className="branch-detail-row">
                    <Clock size={14} />
                    <span>{b.opening_hours}</span>
                  </div>
                )}

                <div className="branch-shipping-badge">
                  {b.company_covers_shipping ? (
                    <span
                      className="shipping-badge shipping-badge--internal"
                      title="Envíos a cargo de la empresa (personal propio)"
                    >
                      🚚 Envíos propios (Empresa)
                    </span>
                  ) : (
                    <span
                      className="shipping-badge shipping-badge--external"
                      title="Envíos gestionados por riders de Sercio"
                    >
                      🛵 Envíos por riders de Sercio
                    </span>
                  )}
                </div>
              </div>

              <div className="branch-card__footer">
                <div className="branch-pickup-toggle">
                  <button
                    type="button"
                    className="pickup-switch-btn"
                    onClick={() =>
                      togglePickupMutation.mutate({
                        id: b.id,
                        is_pickup_point: !b.is_pickup_point,
                      })
                    }
                  >
                    {b.is_pickup_point ? (
                      <ToggleRight size={28} className="switch-icon--on" />
                    ) : (
                      <ToggleLeft size={28} className="switch-icon--off" />
                    )}
                  </button>
                  <span className="pickup-toggle-label">
                    {b.is_pickup_point
                      ? "Punto de retiro activo"
                      : "Punto de retiro desactivado"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editingBranch ? "Editar Sucursal" : "Agregar Sucursal"}
        >
          <form className="branch-modal-form" onSubmit={handleFormSubmit}>
            <div className="branch-form-group">
              <label className="commercial-label">Nombre de la Sucursal*</label>
              <input
                type="text"
                required
                placeholder="Ej: Sucursal Central / Local Palermo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="branch-form-row">
              <div className="branch-form-group flex-2">
                <label className="commercial-label">Calle*</label>
                <input
                  type="text"
                  required
                  placeholder="Av. Santa Fe"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="branch-form-group flex-1">
                <label className="commercial-label">Número*</label>
                <input
                  type="text"
                  required
                  placeholder="3456"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
              <div className="branch-form-group flex-1">
                <label className="commercial-label">Piso/Depto</label>
                <input
                  type="text"
                  placeholder="PB 'A'"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
            </div>

            <div className="branch-form-row">
              <div className="branch-form-group flex-1">
                <label className="commercial-label">Código Postal*</label>
                <input
                  type="text"
                  required
                  placeholder="C1425"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              <div className="branch-form-group flex-2">
                <label className="commercial-label">Teléfono de Contacto</label>
                <input
                  type="tel"
                  placeholder="+54 11 5555-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="branch-form-group">
              <label className="commercial-label">Horarios de Atención</label>
              <input
                type="text"
                placeholder="Ej: Lun a Vie 9 a 18 hs - Sáb 9 a 13 hs"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
              />
            </div>

            {/* Company covers shipping checkbox */}
            <div className="branch-checkbox-card">
              <label className="branch-checkbox-label">
                <input
                  type="checkbox"
                  checked={companyCoversShipping}
                  onChange={(e) => setCompanyCoversShipping(e.target.checked)}
                />
                <span className="branch-checkbox-title">
                  La empresa se hace cargo de los envíos (empleados propios)
                </span>
              </label>
              <p className="branch-checkbox-tooltip">
                ℹ️ Si marcas esta opción, las devoluciones no liquidarán costo
                de envío a riders externos y los envíos serán gestionados por tu
                propio personal.
              </p>
            </div>

            {/* Open / Closed state in modal */}
            <div className="branch-pickup-toggle-form">
              <button
                type="button"
                className="pickup-switch-btn"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                {isOpen ? (
                  <ToggleRight size={28} className="switch-icon--on" />
                ) : (
                  <ToggleLeft size={28} className="switch-icon--off" />
                )}
              </button>
              <span className="pickup-toggle-label">
                {isOpen
                  ? "Sucursal abierta (disponible para recibir pedidos)"
                  : "Sucursal cerrada temporalmente"}
              </span>
            </div>

            {/* Coordinates / Map adjustment */}
            <div className="branch-coords-box">
              <div className="branch-coords-header-row">
                <span className="commercial-label">
                  Ubicación Geográfica (Coordenadas)
                </span>
                <button
                  type="button"
                  className="branch-gps-btn"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setLat(Number(pos.coords.latitude.toFixed(6)));
                          setLng(Number(pos.coords.longitude.toFixed(6)));
                          showSuccess("Coordenadas GPS obtenidas con éxito.");
                        },
                        () =>
                          showError(
                            "No se pudo obtener la ubicación GPS actual.",
                          ),
                      );
                    }
                  }}
                >
                  📍 Usar mi ubicación GPS actual
                </button>
              </div>
              <p className="branch-coords-hint">
                Coordenadas para el cálculo de distancia y envíos por rider.
              </p>
              <div className="branch-form-row">
                <div className="branch-form-group flex-1">
                  <label className="commercial-label">Latitud</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || "")}
                  />
                </div>
                <div className="branch-form-group flex-1">
                  <label className="commercial-label">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || "")}
                  />
                </div>
              </div>
            </div>

            <div className="branch-pickup-toggle-form">
              <button
                type="button"
                className="pickup-switch-btn"
                onClick={() => setIsPickupPoint((prev) => !prev)}
              >
                {isPickupPoint ? (
                  <ToggleRight size={28} className="switch-icon--on" />
                ) : (
                  <ToggleLeft size={28} className="switch-icon--off" />
                )}
              </button>
              <span className="pickup-toggle-label">
                Habilitar esta sucursal como punto de retiro para compradores
              </span>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="branches-section__add-btn"
                disabled={saveMutation.isPending}
              >
                {editingBranch ? "Guardar cambios" : "Crear sucursal"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmOpen && branchToDelete && (
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="Eliminar Sucursal"
        >
          <div className="delete-confirm-modal">
            <p>
              ¿Estás seguro de que deseás eliminar la sucursal{" "}
              <strong>{branchToDelete.name}</strong>? Los compradores ya no
              podrán seleccionar este punto de retiro.
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(branchToDelete.id)}
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
