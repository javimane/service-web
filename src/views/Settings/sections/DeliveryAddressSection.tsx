"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Home,
  Check,
  X,
  Loader2,
  Navigation,
} from "lucide-react";
import {
  commerceService,
  UserAddress,
  CreateUserAddressDto,
} from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import GoogleMapPickerModal, {
  GoogleAddressResult,
  extractAddressFromGeocoder,
} from "@/components/GoogleMapPickerModal/GoogleMapPickerModal";
import { useJsApiLoader } from "@react-google-maps/api";
import { getProvincesAction } from "@/app/actions/provinces";
import { getDepartmentsAction } from "@/app/actions/locations";
import "./DeliveryAddressSection.css";

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];
const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  "";

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(provincia de |province of )/, "")
    .replace(/^(ciudad autonoma de |ciudad de )/, "")
    .trim();

function matchProvince(
  provinceList: Array<{ id: number; name: string }>,
  targetName: string,
): { id: number; name: string } | undefined {
  if (!targetName) return undefined;
  const targetNorm = normalizeText(targetName);

  return provinceList.find((p) => {
    const pNorm = normalizeText(p.name);
    if (pNorm === targetNorm) return true;
    if (pNorm.length > 3 && targetNorm.includes(pNorm)) return true;
    if (targetNorm.length > 3 && pNorm.includes(targetNorm)) return true;

    const isCabaP =
      pNorm.includes("caba") ||
      pNorm.includes("capital") ||
      pNorm.includes("buenos aires");
    const isCabaT =
      targetNorm.includes("caba") ||
      targetNorm.includes("capital") ||
      targetNorm.includes("ciudad autonoma");

    if (isCabaP && isCabaT) return true;
    return false;
  });
}

function matchDepartment(
  deptList: Array<{ id: number; name: string }>,
  targetName: string,
): { id: number; name: string } | undefined {
  if (!targetName) return undefined;
  const targetNorm = normalizeText(targetName);

  return deptList.find((d) => {
    const dNorm = normalizeText(d.name);
    return (
      dNorm === targetNorm ||
      (dNorm.length > 3 && targetNorm.includes(dNorm)) ||
      (targetNorm.length > 3 && dNorm.includes(targetNorm))
    );
  });
}

interface DeliveryAddressSectionProps {
  userId?: string;
}

export default function DeliveryAddressSection({
  userId,
}: DeliveryAddressSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();

  useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Modal & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserAddress | null>(null);

  // Form fields
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [block, setBlock] = useState("");
  const [betweenStreets, setBetweenStreets] = useState("");
  const [notes, setNotes] = useState("");
  const [provinceId, setProvinceId] = useState<number | string>("");
  const [departmentId, setDepartmentId] = useState<number | string>("");
  const [departmentName, setDepartmentName] = useState("");
  const [pendingProvinceName, setPendingProvinceName] = useState<string | null>(
    null,
  );
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);

  // Location dropdown lists
  const [provinces, setProvinces] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [departments, setDepartments] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Fetch provinces
  useEffect(() => {
    let isMounted = true;
    getProvincesAction()
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        setProvinces(list);
      })
      .catch((err) =>
        console.error("Error loading provinces for addresses:", err),
      );
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch departments when province changes
  useEffect(() => {
    if (!provinceId) {
      setDepartments([]);
      return;
    }
    setLoadingDepartments(true);
    let isMounted = true;
    getDepartmentsAction({ provinceId: String(provinceId) })
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        setDepartments(list);
      })
      .catch((err) =>
        console.error("Error loading departments for address:", err),
      )
      .finally(() => {
        if (isMounted) setLoadingDepartments(false);
      });
  }, [provinceId]);

  // Match province when provinces list loads
  useEffect(() => {
    if (pendingProvinceName && provinces.length > 0 && !provinceId) {
      const matched = matchProvince(provinces, pendingProvinceName);
      if (matched) {
        setProvinceId(matched.id);
        setPendingProvinceName(null);
      }
    }
  }, [provinces, pendingProvinceName, provinceId]);

  // Match department when departments list loads
  useEffect(() => {
    if (departmentName && departments.length > 0 && !departmentId) {
      const matched = matchDepartment(departments, departmentName);
      if (matched) {
        setDepartmentId(matched.id);
      }
    }
  }, [departments, departmentName, departmentId]);

  // Handler for address data resolved from Google Maps
  const handleAddressResolved = (res: GoogleAddressResult) => {
    if (res.street) setStreet(res.street);
    if (res.number) setNumber(res.number);
    if (res.postalCode) setPostalCode(res.postalCode);
    if (res.lat) setLatitude(res.lat);
    if (res.lng) setLongitude(res.lng);

    if (res.department) {
      setDepartmentName(res.department);
      if (departments.length > 0) {
        const matchedDept = matchDepartment(departments, res.department);
        if (matchedDept) setDepartmentId(matchedDept.id);
      }
    }

    if (res.province) {
      setPendingProvinceName(res.province);
      const matched = matchProvince(provinces, res.province);
      if (matched) {
        setProvinceId(matched.id);
      }
    }

    showSuccess(
      "Datos completados desde Google Maps. Podés verificarlos o modificarlos si es necesario.",
    );
  };

  // Direct geolocation from form
  const handleUseCurrentLocationDirectly = () => {
    if (!navigator.geolocation) {
      showError("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocatingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const roundedLat = Number(lat.toFixed(6));
        const roundedLng = Number(lng.toFixed(6));
        setLatitude(roundedLat);
        setLongitude(roundedLng);

        if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: roundedLat, lng: roundedLng } },
            (results, status) => {
              setIsLocatingCurrent(false);
              if (status === "OK" && results && results.length > 0) {
                const parsed = extractAddressFromGeocoder(
                  results,
                  roundedLat,
                  roundedLng,
                );
                handleAddressResolved(parsed);
              } else {
                showSuccess(
                  "Coordenadas GPS fijadas. Completá calle y número en el formulario.",
                );
              }
            },
          );
        } else {
          setIsLocatingCurrent(false);
          showSuccess(
            "Coordenadas GPS fijadas. Podés abrir Google Maps o completar los datos.",
          );
        }
      },
      (error) => {
        setIsLocatingCurrent(false);
        console.error("Geolocation error:", error);
        showError(
          "No se pudo obtener tu ubicación. Verificá los permisos del navegador.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Fetch user addresses
  const {
    data: addressList = [],
    isLoading,
    refetch,
  } = useQuery<UserAddress[]>({
    queryKey: ["user-addresses", userId],
    queryFn: () => commerceService.getUserAddresses(),
    enabled: !!user,
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setStreet("");
    setNumber("");
    setApartmentNumber("");
    setFloor("");
    setBlock("");
    setBetweenStreets("");
    setNotes("");
    setProvinceId("");
    setDepartmentId("");
    setDepartmentName("");
    setPendingProvinceName(null);
    setPostalCode("");
    setLatitude(null);
    setLongitude(null);
    setIsDefault(addressList.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UserAddress) => {
    setEditingItem(item);
    setStreet(item.street || item.street_name || "");
    setNumber(item.number || item.street_number || "");
    setApartmentNumber(item.apartment_number || "");
    setFloor(item.floor || "");
    setBlock(item.block || "");
    setBetweenStreets(item.between_streets || "");
    setNotes(item.notes || "");
    setProvinceId(item.province_id || "");
    setDepartmentId(item.department_id || "");
    setDepartmentName(item.department || item.city || "");
    setPendingProvinceName(item.province || null);
    setPostalCode(item.postal_code || item.zip_code || "");
    setLatitude(item.latitude ?? null);
    setLongitude(item.longitude ?? null);
    setIsDefault(Boolean(item.is_default));
    setIsModalOpen(true);
  };

  // Mutation: Save (Create or Update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!street.trim()) {
        throw new Error("El nombre de la calle es obligatorio.");
      }
      if (!number.trim()) {
        throw new Error("El número de calle es obligatorio.");
      }

      const selectedProvince = provinces.find(
        (p) => String(p.id) === String(provinceId),
      );
      const selectedDept = departments.find(
        (d) => String(d.id) === String(departmentId),
      );

      const payload: CreateUserAddressDto = {
        name: `${street.trim()} ${number.trim()}`,
        street: street.trim(),
        street_name: street.trim(),
        number: number.trim(),
        street_number: number.trim(),
        apartment_number: apartmentNumber.trim() || undefined,
        floor: floor.trim() || undefined,
        block: block.trim() || undefined,
        between_streets: betweenStreets.trim() || undefined,
        notes: notes.trim() || undefined,
        province_id: provinceId ? Number(provinceId) : undefined,
        province: selectedProvince?.name || undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
        department: selectedDept?.name || departmentName || undefined,
        city: selectedDept?.name || departmentName || undefined,
        postal_code: postalCode.trim() || undefined,
        zip_code: postalCode.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        is_default: isDefault,
      };

      if (editingItem) {
        return commerceService.updateUserAddress(editingItem.id, payload);
      } else {
        return commerceService.createUserAddress(payload);
      }
    },
    onSuccess: () => {
      showSuccess(
        editingItem
          ? "Dirección de entrega actualizada exitosamente."
          : "Dirección de entrega guardada exitosamente.",
      );
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      refetch();
    },
    onError: (err: any) => {
      showError(err.message || "Error al guardar la dirección.");
    },
  });

  // Mutation: Set Default
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return commerceService.setDefaultUserAddress(id);
    },
    onSuccess: () => {
      showSuccess("Dirección establecida como predeterminada.");
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      refetch();
    },
    onError: (err: any) => {
      showError(err.message || "Error al cambiar dirección predeterminada.");
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return commerceService.deleteUserAddress(id);
    },
    onSuccess: () => {
      showSuccess("Dirección eliminada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      refetch();
    },
    onError: (err: any) => {
      showError(err.message || "Error al eliminar la dirección.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div id="delivery-address" className="delivery-address-section">
      <div className="delivery-address-section__header">
        <div className="delivery-address-section__title-group">
          <div className="delivery-address-section__icon-badge">
            <Home size={22} />
          </div>
          <div>
            <h3 className="delivery-address-section__title">
              Dirección de Entrega
            </h3>
            <p className="delivery-address-section__subtitle">
              Configura el domicilio y teléfono donde recibirás tus productos
              comprados.
            </p>
          </div>
        </div>

        <button
          data-action-tone="add"
          type="button"
          className="btn-primary delivery-address-section__add-btn"
          onClick={handleOpenCreate}
        >
          <Plus size={16} />
          <span>Agregar Dirección</span>
        </button>
      </div>

      {isLoading ? (
        <div className="delivery-address-section__loading">
          <Loader2 className="delivery-address-section__spinner" size={24} />
          <span>Cargando tus direcciones...</span>
        </div>
      ) : addressList.length === 0 ? (
        <div className="delivery-address-section__empty">
          <MapPin size={36} className="delivery-address-section__empty-icon" />
          <p className="delivery-address-section__empty-title">
            No tienes ninguna dirección registrada
          </p>
          <p className="delivery-address-section__empty-desc">
            Agrega tu domicilio de entrega para que los envíos de tus compras
            lleguen de forma rápida y precisa.
          </p>
          <button
            data-action-tone="add"
            type="button"
            className="btn-primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Agregar primera dirección</span>
          </button>
        </div>
      ) : (
        <div className="delivery-address-section__grid">
          {addressList.map((addr) => {
            const streetLine =
              `${addr.street || addr.street_name || ""} ${addr.number || addr.street_number || ""}`.trim();
            const deptoLine = [
              addr.floor ? `Piso ${addr.floor}` : "",
              addr.apartment_number ? `Dpto ${addr.apartment_number}` : "",
              addr.block ? `Mz ${addr.block}` : "",
            ]
              .filter(Boolean)
              .join(" - ");

            const locationLine = [
              addr.department || addr.city,
              addr.province,
              addr.postal_code || addr.zip_code
                ? `CP ${addr.postal_code || addr.zip_code}`
                : "",
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={addr.id}
                className={`delivery-address-card ${
                  addr.is_default ? "delivery-address-card--default" : ""
                }`}
              >
                <div className="delivery-address-card__header">
                  <div className="delivery-address-card__tag">
                    <MapPin size={16} />
                    <span className="delivery-address-card__name">
                      {addr.name || streetLine || "Domicilio"}
                    </span>
                  </div>

                  {addr.is_default && (
                    <span className="delivery-address-card__badge-default">
                      <CheckCircle2 size={13} />
                      <span>Predeterminada</span>
                    </span>
                  )}
                </div>

                <div className="delivery-address-card__body">
                  <div className="delivery-address-card__line delivery-address-card__line--main">
                    {streetLine || "Dirección sin calle"}
                  </div>

                  {deptoLine && (
                    <div className="delivery-address-card__line delivery-address-card__line--sub">
                      {deptoLine}
                    </div>
                  )}

                  {addr.between_streets && (
                    <div className="delivery-address-card__line delivery-address-card__line--detail">
                      <span>Entre calles:</span> {addr.between_streets}
                    </div>
                  )}

                  {locationLine && (
                    <div className="delivery-address-card__line delivery-address-card__line--location">
                      📍 {locationLine}
                    </div>
                  )}

                  {addr.notes && (
                    <div className="delivery-address-card__line delivery-address-card__line--notes">
                      <em>&quot;{addr.notes}&quot;</em>
                    </div>
                  )}

                  {addr.latitude && addr.longitude && (
                    <div className="delivery-address-card__gps-badge">
                      <Navigation size={12} />
                      <span>Ubicación GPS fijada</span>
                    </div>
                  )}
                </div>

                <div className="delivery-address-card__actions">
                  {!addr.is_default && (
                    <button
                      type="button"
                      className="delivery-address-card__btn-default"
                      title="Establecer como dirección predeterminada"
                      disabled={setDefaultMutation.isPending}
                      onClick={() => setDefaultMutation.mutate(addr.id)}
                    >
                      <Check size={14} />
                      <span>Usar como predeterminada</span>
                    </button>
                  )}

                  <div className="delivery-address-card__btn-group">
                    <button
                      type="button"
                      className="delivery-address-card__icon-btn"
                      title="Editar dirección"
                      onClick={() => handleOpenEdit(addr)}
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      type="button"
                      className="delivery-address-card__icon-btn delivery-address-card__icon-btn--danger"
                      title="Eliminar dirección"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (
                          confirm(
                            "¿Estás seguro de que deseas eliminar esta dirección de entrega?",
                          )
                        ) {
                          deleteMutation.mutate(addr.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Dirección */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? "Modificar Dirección de Entrega"
            : "Nueva Dirección de Entrega"
        }
      >
        <form onSubmit={handleSubmit} className="delivery-address-form">
          {/* Carga con Google Maps & Ubicación Actual */}
          <div className="delivery-address-form__quick-actions">
            <div className="delivery-address-form__quick-actions-info">
              <MapPin
                size={18}
                className="delivery-address-form__quick-actions-icon"
              />
              <div>
                <strong>Autocompletar con Google Maps</strong>
                <p>
                  Elegí en el mapa o usá tu GPS para cargar automáticamente
                  calle, número y localidad.
                </p>
              </div>
            </div>
            <div className="delivery-address-form__quick-actions-btns">
              <button
                type="button"
                className="btn-secondary delivery-address-form__action-btn"
                onClick={() => setIsMapOpen(true)}
              >
                <MapPin size={16} />
                <span>Elegir en Google Maps</span>
              </button>
              <button
                type="button"
                className="btn-secondary delivery-address-form__action-btn"
                onClick={handleUseCurrentLocationDirectly}
                disabled={isLocatingCurrent}
              >
                {isLocatingCurrent ? (
                  <Loader2
                    className="delivery-address-section__spinner"
                    size={16}
                  />
                ) : (
                  <Navigation size={16} />
                )}
                <span>
                  {isLocatingCurrent
                    ? "Obteniendo GPS..."
                    : "Usar mi ubicación"}
                </span>
              </button>
            </div>
          </div>

          {/* Calle y Número */}
          <div className="delivery-address-form__row">
            <div className="delivery-address-form__field delivery-address-form__field--grow">
              <label className="delivery-address-form__label">
                Nombre de Calle *
              </label>
              <input
                type="text"
                className="delivery-address-form__input"
                placeholder="Ej: Av. San Martín"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </div>

            <div className="delivery-address-form__field delivery-address-form__field--sm">
              <label className="delivery-address-form__label">Número *</label>
              <input
                type="text"
                className="delivery-address-form__input"
                placeholder="Ej: 1450"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Piso, Departamento, Manzana */}
          <div className="delivery-address-form__row delivery-address-form__row--3cols">
            <div className="delivery-address-form__field">
              <label className="delivery-address-form__label">Piso</label>
              <input
                type="text"
                className="delivery-address-form__input"
                placeholder="Ej: 4"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>

            <div className="delivery-address-form__field">
              <label className="delivery-address-form__label">
                Departamento N°
              </label>
              <input
                type="text"
                className="delivery-address-form__input"
                placeholder="Ej: B"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
              />
            </div>

            <div className="delivery-address-form__field">
              <label className="delivery-address-form__label">Manzana</label>
              <input
                type="text"
                className="delivery-address-form__input"
                placeholder="Ej: Mz 12"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
              />
            </div>
          </div>

          {/* Entre Calles */}
          <div className="delivery-address-form__field">
            <label className="delivery-address-form__label">Entre Calles</label>
            <input
              type="text"
              className="delivery-address-form__input"
              placeholder="Ej: Entre Belgrano y Moreno"
              value={betweenStreets}
              onChange={(e) => setBetweenStreets(e.target.value)}
            />
          </div>

          {/* Provincia, Departamento provincial y Código Postal */}
          <div className="delivery-address-form__row delivery-address-form__row--3cols">
            <div className="delivery-address-form__field">
              <label className="delivery-address-form__label">Provincia</label>
              <select
                className="delivery-address-form__select"
                value={provinceId}
                onChange={(e) => {
                  setProvinceId(e.target.value);
                  setDepartmentId("");
                }}
              >
                <option value="">Seleccionar provincia</option>
                {provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="delivery-address-form__field">
              <label className="delivery-address-form__label">
                Departamento / Partido
              </label>
              <select
                className="delivery-address-form__select"
                value={departmentId}
                disabled={!provinceId || loadingDepartments}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">
                  {loadingDepartments
                    ? "Cargando..."
                    : "Seleccionar departamento"}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="delivery-address-form__field">
              <label className="delivery-address-form__label">
                Código Postal
              </label>
              <input
                type="text"
                className="delivery-address-form__input"
                placeholder="Ej: 1425"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>

          {/* Nota / Indicaciones */}
          <div className="delivery-address-form__field">
            <label className="delivery-address-form__label">
              Nota / Indicaciones de Entrega
            </label>
            <textarea
              className="delivery-address-form__textarea"
              rows={2}
              placeholder="Ej: Tocar timbre blanco, dejar con portería si no contesto."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Ubicación con Mapa / Coordenadas */}
          <div className="delivery-address-form__map-box">
            <div className="delivery-address-form__map-header">
              <div className="delivery-address-form__map-info">
                <Navigation
                  size={18}
                  className="delivery-address-form__map-icon"
                />
                <div>
                  <strong>Ubicación exacta en Google Maps</strong>
                  <p>
                    {latitude && longitude
                      ? `Coordenadas fijadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                      : "Fija el punto exacto para que el repartidor llegue sin demoras."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary delivery-address-form__map-btn"
                onClick={() => setIsMapOpen(true)}
              >
                <MapPin size={16} />
                <span>
                  {latitude && longitude
                    ? "Cambiar en Google Maps"
                    : "Abrir Google Maps"}
                </span>
              </button>
            </div>
          </div>

          {/* Checkbox predeterminada */}
          <div className="delivery-address-form__checkbox-row">
            <label className="delivery-address-form__checkbox-label">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <span>Establecer como dirección de entrega predeterminada</span>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="delivery-address-form__actions">
            <button
              data-action-tone="cancel"
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saveMutation.isPending}
            >
              <X size={16} />
              <span>Cancelar</span>
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2
                    className="delivery-address-section__spinner"
                    size={16}
                  />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{editingItem ? "Actualizar" : "Guardar"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Picker de Google Maps */}
      {isMapOpen && (
        <GoogleMapPickerModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          initialLat={latitude}
          initialLng={longitude}
          onSelectAddress={(data) => {
            handleAddressResolved(data);
          }}
        />
      )}
    </div>
  );
}
