"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import {
  MapPin,
  Search,
  Navigation,
  Loader2,
  Check,
  X,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import "./GoogleMapPickerModal.css";

export interface GoogleAddressResult {
  street: string;
  number: string;
  province: string;
  department: string;
  postalCode: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

interface GoogleMapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (result: GoogleAddressResult) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  title?: string;
}

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];
const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  "";

const DEFAULT_MAP_CENTER = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires

export function extractAddressFromGeocoder(
  results: google.maps.GeocoderResult[],
  lat: number,
  lng: number,
): GoogleAddressResult {
  const matchWithNumber = results.find(
    (r) =>
      r.address_components.some((c) => c.types.includes("route")) &&
      r.address_components.some((c) => c.types.includes("street_number")),
  );
  const matchWithRoute = results.find((r) =>
    r.address_components.some((c) => c.types.includes("route")),
  );
  const best = matchWithNumber || matchWithRoute || results[0];

  const getComponent = (type: string): string => {
    const comp = best?.address_components?.find((c) => c.types.includes(type));
    if (comp) return comp.long_name;
    for (const r of results) {
      const c = r.address_components?.find((part) => part.types.includes(type));
      if (c) return c.long_name;
    }
    return "";
  };

  const street = getComponent("route");
  const number = getComponent("street_number");
  const province = getComponent("administrative_area_level_1");
  const department =
    getComponent("administrative_area_level_2") ||
    getComponent("locality") ||
    getComponent("sublocality_level_1") ||
    getComponent("sublocality");
  const postalCode = getComponent("postal_code");
  const formattedAddress = best?.formatted_address || "";

  return {
    street,
    number,
    province,
    department,
    postalCode,
    formattedAddress,
    lat,
    lng,
  };
}

export default function GoogleMapPickerModal({
  isOpen,
  onClose,
  onSelectAddress,
  initialLat,
  initialLng,
  title = "Seleccionar dirección en Google Maps",
}: GoogleMapPickerModalProps) {
  const { showError, showSuccess } = useAlert();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_MAP_CENTER);
  const [resolvedAddress, setResolvedAddress] = useState<GoogleAddressResult | null>(null);

  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchError, setSearchError] = useState("");

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocodeRequestId = useRef(0);

  // Initialize or reset when modal opens or coordinates change
  useEffect(() => {
    if (!isOpen) return;

    if (
      typeof initialLat === "number" &&
      typeof initialLng === "number" &&
      !isNaN(initialLat) &&
      !isNaN(initialLng) &&
      (initialLat !== 0 || initialLng !== 0)
    ) {
      const pos = { lat: initialLat, lng: initialLng };
      setMarkerPos(pos);
      setMapCenter(pos);
      geocodeCoordinates(pos.lat, pos.lng);
    } else {
      setMarkerPos(null);
      setMapCenter(DEFAULT_MAP_CENTER);
      setResolvedAddress(null);
    }
    setSearchText("");
    setSearchError("");
  }, [isOpen, initialLat, initialLng]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const geocodeCoordinates = useCallback((lat: number, lng: number) => {
    if (typeof window === "undefined" || !window.google?.maps?.Geocoder) return;

    const reqId = ++geocodeRequestId.current;
    setIsResolving(true);
    setSearchError("");

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (reqId !== geocodeRequestId.current) return;
      setIsResolving(false);

      if (status === "OK" && results && results.length > 0) {
        const parsed = extractAddressFromGeocoder(results, lat, lng);
        setResolvedAddress(parsed);
      } else {
        setResolvedAddress({
          street: "",
          number: "",
          province: "",
          department: "",
          postalCode: "",
          formattedAddress: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
          lat,
          lng,
        });
      }
    });
  }, []);

  const handlePositionSelect = (lat: number, lng: number, pan = false) => {
    const roundedLat = Number(lat.toFixed(6));
    const roundedLng = Number(lng.toFixed(6));
    setMarkerPos({ lat: roundedLat, lng: roundedLng });

    if (pan && mapRef.current) {
      mapRef.current.panTo({ lat: roundedLat, lng: roundedLng });
      mapRef.current.setZoom(16);
    }

    geocodeCoordinates(roundedLat, roundedLng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocating(true);
    setSearchError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const newCenter = { lat: latitude, lng: longitude };
        setMapCenter(newCenter);
        handlePositionSelect(latitude, longitude, true);
        showSuccess("Ubicación actual detectada en el mapa.");
      },
      (error) => {
        setIsLocating(false);
        console.error("Geolocation error:", error);
        showError(
          "No se pudo acceder a tu ubicación. Verificá los permisos del navegador.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryText = searchText.trim();
    if (!queryText) {
      setSearchError("Ingresá una dirección para buscar en el mapa.");
      return;
    }

    if (!window.google?.maps?.Geocoder) {
      setSearchError("El servicio de Google Maps no está disponible en este momento.");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    const geocoder = new window.google.maps.Geocoder();
    const fullQuery = queryText.toLowerCase().includes("argentina")
      ? queryText
      : `${queryText}, Argentina`;

    geocoder.geocode({ address: fullQuery }, (results, status) => {
      setIsSearching(false);
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        setMapCenter({ lat, lng });
        handlePositionSelect(lat, lng, true);
      } else {
        setSearchError(
          "No se encontró la dirección indicada. Probá con calle y número o hacé clic en el mapa.",
        );
      }
    });
  };

  const handleConfirm = () => {
    if (!markerPos) return;

    const data: GoogleAddressResult = resolvedAddress || {
      street: "",
      number: "",
      province: "",
      department: "",
      postalCode: "",
      formattedAddress: "",
      lat: markerPos.lat,
      lng: markerPos.lng,
    };

    onSelectAddress(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="google-map-picker-modal__overlay">
      <div className="google-map-picker-modal">
        {/* Header */}
        <div className="google-map-picker-modal__header">
          <div className="google-map-picker-modal__title-group">
            <div className="google-map-picker-modal__icon-badge">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="google-map-picker-modal__title">{title}</h3>
              <p className="google-map-picker-modal__subtitle">
                Buscá o marcá el punto de entrega en Google Maps
              </p>
            </div>
          </div>

          <button
            type="button"
            className="google-map-picker-modal__close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Search & GPS Location */}
        <div className="google-map-picker-modal__toolbar">
          <form
            onSubmit={handleSearch}
            className="google-map-picker-modal__search-form"
          >
            <div className="google-map-picker-modal__search-input-wrap">
              <Search
                size={18}
                className="google-map-picker-modal__search-icon"
              />
              <input
                type="text"
                className="google-map-picker-modal__search-input"
                placeholder="Buscar por calle, número, localidad (ej: Av. Cabildo 2040, CABA)..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-secondary google-map-picker-modal__search-btn"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Search size={16} />
              )}
              <span>{isSearching ? "Buscando..." : "Buscar"}</span>
            </button>
          </form>

          <button
            type="button"
            className={`btn-secondary google-map-picker-modal__gps-btn ${
              isLocating ? "google-map-picker-modal__gps-btn--loading" : ""
            }`}
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            title="Usar mi ubicación actual vía GPS"
          >
            {isLocating ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Navigation size={16} />
            )}
            <span>{isLocating ? "Ubicando..." : "Usar mi ubicación"}</span>
          </button>
        </div>

        {searchError && (
          <div className="google-map-picker-modal__alert" role="alert">
            <AlertCircle size={16} />
            <span>{searchError}</span>
          </div>
        )}

        {/* Map Body */}
        <div className="google-map-picker-modal__body">
          {!GOOGLE_MAPS_API_KEY ? (
            <div className="google-map-picker-modal__error-state">
              <AlertCircle size={36} />
              <p>Clave de Google Maps no configurada en las variables de entorno.</p>
            </div>
          ) : loadError ? (
            <div className="google-map-picker-modal__error-state">
              <AlertCircle size={36} />
              <p>No se pudo conectar con Google Maps. Verificá tu conexión a internet.</p>
            </div>
          ) : !isLoaded ? (
            <div className="google-map-picker-modal__loading-state">
              <Loader2 className="animate-spin" size={32} />
              <span>Cargando Google Maps...</span>
            </div>
          ) : (
            <GoogleMap
              mapContainerClassName="google-map-picker-modal__map-canvas"
              center={mapCenter}
              zoom={markerPos ? 16 : 13}
              onLoad={onMapLoad}
              onClick={(e) => {
                if (e.latLng) {
                  handlePositionSelect(e.latLng.lat(), e.latLng.lng());
                }
              }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {markerPos && (
                <MarkerF
                  position={markerPos}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      handlePositionSelect(e.latLng.lat(), e.latLng.lng());
                    }
                  }}
                />
              )}
            </GoogleMap>
          )}
        </div>

        {/* Preview of resolved address */}
        <div className="google-map-picker-modal__preview">
          <div className="google-map-picker-modal__preview-header">
            <div className="google-map-picker-modal__preview-title">
              <MapPin size={16} />
              <span>Dirección detectada por Google</span>
            </div>
            {isResolving && (
              <span className="google-map-picker-modal__resolving-badge">
                <Loader2 className="animate-spin" size={13} />
                <span>Identificando calle y número...</span>
              </span>
            )}
          </div>

          <div className="google-map-picker-modal__preview-content">
            {resolvedAddress?.formattedAddress ? (
              <>
                <p className="google-map-picker-modal__preview-main">
                  {resolvedAddress.formattedAddress}
                </p>
                <div className="google-map-picker-modal__preview-tags">
                  {resolvedAddress.street && (
                    <span className="google-map-picker-modal__tag">
                      Calle: <strong>{resolvedAddress.street}</strong>
                    </span>
                  )}
                  {resolvedAddress.number && (
                    <span className="google-map-picker-modal__tag">
                      N°: <strong>{resolvedAddress.number}</strong>
                    </span>
                  )}
                  {resolvedAddress.department && (
                    <span className="google-map-picker-modal__tag">
                      Localidad: <strong>{resolvedAddress.department}</strong>
                    </span>
                  )}
                  {resolvedAddress.province && (
                    <span className="google-map-picker-modal__tag">
                      Provincia: <strong>{resolvedAddress.province}</strong>
                    </span>
                  )}
                  {resolvedAddress.postalCode && (
                    <span className="google-map-picker-modal__tag">
                      CP: <strong>{resolvedAddress.postalCode}</strong>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="google-map-picker-modal__preview-placeholder">
                <HelpCircle size={15} />
                <span>
                  Hacé clic en el mapa, arrastrá el marcador o buscá una dirección para
                  seleccionar el punto de entrega.
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="google-map-picker-modal__footer">
          <p className="google-map-picker-modal__hint">
            Al confirmar, los datos se autocompletarán en el formulario para que puedas revisarlos y editarlos.
          </p>
          <div className="google-map-picker-modal__actions">
            <button
              data-action-tone="cancel"
              type="button"
              className="btn-secondary google-map-picker-modal__btn"
              onClick={onClose}
            >
              <X size={16} />
              <span>Cancelar</span>
            </button>
            <button
              type="button"
              className="btn-primary google-map-picker-modal__btn"
              onClick={handleConfirm}
              disabled={!markerPos || isResolving}
            >
              <Check size={16} />
              <span>Confirmar dirección</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
