"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
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
import { getAccessToken } from "@/utils/auth";
import { getProfessionalMeAction } from "@/app/actions/professionals";
import { getProvincesAction } from "@/app/actions/locations";
import { setApiAccessToken } from "@/services/apiClient";
import Modal from "@/components/Modal/Modal";
import "./BranchesSection.css";

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  "";
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];
const DEFAULT_MAP_CENTER = { lat: -34.6037, lng: -58.3816 };

type MapAddress = { street: string; number: string; zipCode: string; province: string };

const normalizeProvince = (value: string) => value.toLocaleLowerCase("es")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/^(provincia de |province of )/, "").trim();

function addressFromGeocode(results: google.maps.GeocoderResult[]): MapAddress {
  const bestMatch =
    results.find(
      (result) =>
        result.address_components.some((part) =>
          part.types.includes("route"),
        ) &&
        result.address_components.some((part) =>
          part.types.includes("street_number"),
        ),
    ) ??
    results.find((result) =>
      result.address_components.some((part) => part.types.includes("route")),
    ) ??
    results[0];
  const getPart = (type: string) =>
    bestMatch.address_components.find((part) => part.types.includes(type))
      ?.long_name ?? "";
  return {
    street: getPart("route"),
    number: getPart("street_number"),
    province: getPart("administrative_area_level_1"),
    zipCode:
      getPart("postal_code") ||
      results
        .flatMap((result) => result.address_components)
        .find((part) => part.types.includes("postal_code"))?.long_name ||
      "",
  };
}

function BranchLocationMap({
  latitude,
  longitude,
  address,
  onSelect,
  onAddressResolved,
}: {
  latitude: number | "";
  longitude: number | "";
  address: string;
  onSelect: (latitude: number, longitude: number) => number;
  onAddressResolved: (address: MapAddress, editRevision: number) => void;
}) {
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const requestVersion = useRef(0);
  useEffect(
    () => () => {
      requestVersion.current += 1;
    },
    [],
  );
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const selectedPosition =
    typeof latitude === "number" && typeof longitude === "number"
      ? { lat: latitude, lng: longitude }
      : null;

  const selectPosition = (
    position: google.maps.LatLng | null,
    knownResults?: google.maps.GeocoderResult[],
  ) => {
    if (!position) return;
    const request = ++requestVersion.current;
    const coordinates = {
      lat: Number(position.lat().toFixed(6)),
      lng: Number(position.lng().toFixed(6)),
    };
    const editRevision = onSelect(coordinates.lat, coordinates.lng);
    setSearchError("");
    if (knownResults?.length) {
      const resolvedAddress = addressFromGeocode(knownResults);
      onAddressResolved(resolvedAddress, editRevision);
      if (
        !resolvedAddress.street ||
        !resolvedAddress.number ||
        !resolvedAddress.zipCode
      ) {
        setSearchError(
          "Google no identificó todos los datos de esta dirección. Completá los campos faltantes antes de guardar.",
        );
      }
      return;
    }
    setIsResolving(true);
    new google.maps.Geocoder().geocode(
      { location: coordinates },
      (results, status) => {
        if (request !== requestVersion.current) return;
        setIsResolving(false);
        if (status === "OK" && results?.length) {
          const resolvedAddress = addressFromGeocode(results);
          onAddressResolved(resolvedAddress, editRevision);
          if (
            !resolvedAddress.street ||
            !resolvedAddress.number ||
            !resolvedAddress.zipCode
          ) {
            setSearchError(
              "Google no identificó todos los datos de esta dirección. Completá los campos faltantes antes de guardar.",
            );
          }
        } else {
          setSearchError(
            "Google no pudo identificar la dirección del punto. Completá la calle, el número y el código postal manualmente.",
          );
        }
      },
    );
  };

  const searchAddress = () => {
    if (!address.trim()) {
      setSearchError("Completá la calle y el número antes de buscar.");
      return;
    }
    const request = ++requestVersion.current;
    setIsSearching(true);
    setSearchError("");
    new google.maps.Geocoder().geocode(
      { address: `${address}, Argentina` },
      (results, status) => {
        if (request !== requestVersion.current) return;
        setIsSearching(false);
        if (status === "OK" && results?.[0]?.geometry?.location) {
          selectPosition(results[0].geometry.location, results);
        } else {
          setSearchError(
            "No encontramos esa dirección. Ubicá el punto manualmente en el mapa.",
          );
        }
      },
    );
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <p className="branch-location-map__error">
        Configurá NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para elegir la ubicación en
        Google Maps.
      </p>
    );
  }
  if (loadError) {
    return (
      <p className="branch-location-map__error">
        No se pudo cargar Google Maps. Revisá la clave y volvé a intentar.
      </p>
    );
  }
  if (!isLoaded) {
    return (
      <p className="branch-location-map__loading">Cargando Google Maps…</p>
    );
  }

  return (
    <div className="branch-location-map">
      <div className="branch-location-map__toolbar">
        <span>Buscá la dirección o marcá el lugar exacto</span>
        <button
          type="button"
          className="branch-gps-btn"
          onClick={searchAddress}
          disabled={isSearching}
        >
          {isSearching ? "Buscando…" : "Buscar dirección"}
        </button>
      </div>
      <div className="branch-location-map__canvas">
        <GoogleMap
          mapContainerClassName="branch-location-map__google-map"
          center={selectedPosition ?? DEFAULT_MAP_CENTER}
          zoom={selectedPosition ? 16 : 11}
          onClick={(event) => selectPosition(event.latLng)}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {selectedPosition && (
            <MarkerF
              position={selectedPosition}
              draggable
              onDragEnd={(event) => selectPosition(event.latLng)}
            />
          )}
        </GoogleMap>
      </div>
      {searchError && (
        <p className="branch-location-map__error" role="alert">
          {searchError}
        </p>
      )}
      {isResolving && (
        <p className="branch-location-map__loading" role="status">
          Buscando calle y número del punto elegido…
        </p>
      )}
      {selectedPosition && address && !isResolving && (
        <p className="branch-location-map__address">
          <MapPin size={16} /> Dirección seleccionada: {address}
        </p>
      )}
      <p className="branch-coords-hint">
        Hacé clic en el mapa o arrastrá el marcador para ajustar la ubicación.
      </p>
    </div>
  );
}

export default function BranchesSection() {
  const token = getAccessToken();
  setApiAccessToken(token);
  const queryClient = useQueryClient();
  const { sessionStatus } = useAuth();
  const { showSuccess, showError } = useAlert();

  const professionalId =
    sessionStatus?.subscription?.professional_id ?? sessionStatus?.professional_id;
  const {
    data: professional,
    isLoading: isLoadingProfessional,
    isError: isProfessionalError,
    refetch: refetchProfessional,
  } = useQuery({
    queryKey: ["professional-me", professionalId],
    queryFn: async () => {
      const result = await getProfessionalMeAction({ token: await getAccessToken() });
      return result?.data ?? null;
    },
    enabled: Boolean(professionalId),
    staleTime: 1000 * 60 * 5,
  });
  const companyData = professional?.companies ?? professional?.Company;
  const company = Array.isArray(companyData) ? companyData[0] : companyData;
  const companyId = Number(company?.id ?? sessionStatus?.company_id) || undefined;
  const { data: provinces = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["provinces"],
    queryFn: async () => (await getProvincesAction())?.data ?? [],
    staleTime: 1000 * 60 * 60 * 24,
  });

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
  const [provinceId, setProvinceId] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [isPickupPoint, setIsPickupPoint] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [companyCoversShipping, setCompanyCoversShipping] = useState(false);
  const [autoPrintTickets, setAutoPrintTickets] = useState(false);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number | "">(0);
  const [deliveryEtaMinutes, setDeliveryEtaMinutes] = useState<number | "">(60);
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [addressFromMap, setAddressFromMap] = useState(false);
  const addressEditRevision = useRef(0);

  const clearLocation = () => {
    setLat("");
    setLng("");
  };

  const handleAddressFieldChange = (
    value: string,
    update: (value: string) => void,
  ) => {
    addressEditRevision.current += 1;
    update(value);
    if (!addressFromMap) clearLocation();
  };

  const {
    data: rawBranches,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["merchant-branches", companyId],
    queryFn: () => commerceService.branches(companyId!),
    enabled: Boolean(companyId),
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
    onError: (error) => {
      const message = (error as { response?: { data?: { message?: string | string[] } } })
        .response?.data?.message;
      showError(Array.isArray(message) ? message.join(". ") : message || "No se pudo guardar la sucursal.");
    },
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
    addressEditRevision.current += 1;
    setName("");
    setStreet("");
    setNumber("");
    setFloor("");
    setZipCode("");
    setProvinceId("");
    setPhone("");
    setOpeningHours("Lun a Vie 09:00 a 18:00 hs - Sáb 09:00 a 13:00 hs");
    setIsPickupPoint(true);
    setIsOpen(true);
    setCompanyCoversShipping(false);
    setAutoPrintTickets(false);
    setDeliveryRadiusKm(0);
    setDeliveryEtaMinutes(60);
    setLat("");
    setLng("");
    setAddressFromMap(false);
    setModalOpen(true);
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    addressEditRevision.current += 1;
    setName(b.name);
    setStreet(b.street_name || "");
    setNumber(b.street_number || "");
    setFloor(b.floor_apartment || "");
    setZipCode(b.zip_code || "");
    setProvinceId(b.province_id ?? "");
    setPhone(b.phone || "");
    setOpeningHours(b.opening_hours || "");
    setIsPickupPoint(b.is_pickup_point);
    setIsOpen(b.is_open ?? true);
    setCompanyCoversShipping(b.company_covers_shipping ?? false);
    setAutoPrintTickets(b.auto_print_tickets ?? false);
    setDeliveryRadiusKm(b.delivery_radius_km ?? "");
    setDeliveryEtaMinutes(b.delivery_eta_minutes ?? "");
    setLat(b.latitude ?? "");
    setLng(b.longitude ?? "");
    setAddressFromMap(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBranch(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      showError("No encontramos el comercio asociado a tu cuenta. Completá primero el perfil comercial.");
      return;
    }
    if (!name.trim()) {
      showError("Completá el nombre de la sucursal.");
      return;
    }
    if (!street.trim()) {
      showError("Completá la calle de la sucursal o seleccioná otro punto en el mapa.");
      return;
    }
    if (typeof deliveryEtaMinutes !== "number" || !Number.isInteger(deliveryEtaMinutes) || deliveryEtaMinutes < 1) {
      showError("Indicá los minutos estimados de demora de entrega de la sucursal.");
      return;
    }
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      showError("Elegí una ubicación válida para la sucursal en el mapa.");
      return;
    }
    saveMutation.mutate({
      company_id: companyId,
      name: name.trim(),
      street_name: street.trim(),
      street_number: number.trim() || undefined,
      floor_apartment: floor.trim() || undefined,
      zip_code: zipCode.trim() || undefined,
      province_id: provinceId || undefined,
      phone: phone.trim() || undefined,
      opening_hours: openingHours.trim() || undefined,
      is_pickup_point: isPickupPoint,
      is_open: isOpen,
      company_covers_shipping: companyCoversShipping,
      auto_print_tickets: autoPrintTickets,
      delivery_radius_km:
        typeof deliveryRadiusKm === "number" ? deliveryRadiusKm : 0,
      delivery_eta_minutes: deliveryEtaMinutes,
      latitude: typeof lat === "number" ? lat : undefined,
      longitude: typeof lng === "number" ? lng : undefined,
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
        <button data-action-tone="add"
          type="button"
          className="branches-section__add-btn"
          onClick={openAddModal}
          disabled={!companyId}
        >
          <span>Agregar sucursal</span>
        </button>
      </header>

      {/* List or States */}
      {isLoading || isLoadingProfessional ? (
        <div className="branches-state branches-state--loading">
          <Clock className="branches-state__spinner" size={32} />
          <p>Cargando sucursales...</p>
        </div>
      ) : isProfessionalError && !companyId ? (
        <div className="branches-state branches-state--error">
          <AlertCircle size={32} />
          <p>No pudimos cargar el perfil comercial para identificar tu empresa.</p>
          <button type="button" className="btn-primary" onClick={() => refetchProfessional()}>
            Reintentar
          </button>
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
          <h3>{companyId ? "No tenés sucursales registradas" : "Primero completá tu perfil comercial"}</h3>
          <p>
            {companyId
              ? "Agregá tu casa central o puntos de venta físicos para habilitar el retiro en tienda para tus compradores."
              : "Necesitás un comercio registrado antes de crear sucursales."}
          </p>
          <button
            type="button"
            className="branches-section__add-btn"
            onClick={openAddModal}
            disabled={!companyId}
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
                      <h3 className="branch-card__name">
                        {b.is_main ? "Sucursal Principal" : b.name}
                      </h3>
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
                        {b.street_name} {b.street_number}
                        {b.floor_apartment ? `, ${b.floor_apartment}` : ""}{" "}
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
                  {!b.is_main && (
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
                  )}
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
                {b.delivery_radius_km != null && (
                  <div className="branch-detail-row">
                    <MapPin size={14} />
                    <span>Entrega hasta {b.delivery_radius_km} km</span>
                  </div>
                )}
                {b.delivery_eta_minutes != null && (
                  <div className="branch-detail-row">
                    <Clock size={14} />
                    <span>Demora de entrega estimada: {b.delivery_eta_minutes} min</span>
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
                  {b.auto_print_tickets && (
                    <span
                      className="shipping-badge shipping-badge--internal"
                      title="Impresión automática de tickets activada para esta sucursal"
                    >
                      🖨️ Auto-impresión activa
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
                  onChange={(e) =>
                    handleAddressFieldChange(e.target.value, setStreet)
                  }
                />
              </div>
              <div className="branch-form-group flex-1">
                <label className="commercial-label">Número*</label>
                <input
                  type="text"
                  required
                  placeholder="3456"
                  value={number}
                  onChange={(e) =>
                    handleAddressFieldChange(e.target.value, setNumber)
                  }
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
                  onChange={(e) =>
                    handleAddressFieldChange(e.target.value, setZipCode)
                  }
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
            <div className="branch-form-group">
              <label className="commercial-label">
                Radio máximo de entrega (km)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={deliveryRadiusKm}
                onChange={(e) =>
                  setDeliveryRadiusKm(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
              <p className="branch-coords-hint">
                Usá 0 para desactivar los envíos desde esta sucursal.
              </p>
            </div>

            <div className="branch-form-group">
              <label className="commercial-label">Demora estimada de entrega (minutos)*</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={deliveryEtaMinutes}
                onChange={(event) => setDeliveryEtaMinutes(event.target.value === "" ? "" : Number(event.target.value))}
              />
              <p className="branch-coords-hint">Se muestra al comprador al elegir esta sucursal.</p>
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

            {/* Auto Print Tickets */}
            <div className="branch-checkbox-card">
              <label className="branch-checkbox-label">
                <input
                  type="checkbox"
                  checked={autoPrintTickets}
                  onChange={(e) => setAutoPrintTickets(e.target.checked)}
                />
                <span className="branch-checkbox-text">
                  🖨️ Impresión automática de tickets
                </span>
              </label>
              <p className="branch-checkbox-tooltip">
                ℹ️ Imprime automáticamente los comprobantes y etiquetas de
                ventas de productos y servicios asignadas a esta sucursal.
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
              <BranchLocationMap
                latitude={lat}
                longitude={lng}
                address={[street.trim(), number.trim(), zipCode.trim()]
                  .filter(Boolean)
                  .join(" ")}
                onSelect={(latitude, longitude) => {
                  setLat(latitude);
                  setLng(longitude);
                  setStreet("");
                  setNumber("");
                  setZipCode("");
                  setProvinceId("");
                  setAddressFromMap(true);
                  return addressEditRevision.current;
                }}
                onAddressResolved={(resolved, editRevision) => {
                  if (editRevision !== addressEditRevision.current) return;
                  setStreet(resolved.street);
                  setNumber(resolved.number);
                  setZipCode(resolved.zipCode);
                  const matchedProvince = provinces.find((province) =>
                    normalizeProvince(province.name) === normalizeProvince(resolved.province),
                  );
                  if (matchedProvince) setProvinceId(matchedProvince.id);
                }}
              />
              <div className="branch-form-group">
                <label className="commercial-label" htmlFor="branch-province">Provincia de la sucursal</label>
                <select id="branch-province" value={provinceId} onChange={(event) => setProvinceId(Number(event.target.value) || "")}>
                  <option value="">Seleccioná una provincia</option>
                  {provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
                </select>
              </div>
              <div className="branch-form-row">
                <div className="branch-form-group flex-1">
                  <label className="commercial-label">Latitud</label>
                  <input type="number" step="any" value={lat} readOnly />
                </div>
                <div className="branch-form-group flex-1">
                  <label className="commercial-label">Longitud</label>
                  <input type="number" step="any" value={lng} readOnly />
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
              <button data-action-tone="cancel"
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
              <button data-action-tone="cancel"
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
