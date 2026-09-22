"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  PolylineF,
  InfoWindowF,
  CircleF,
} from "@react-google-maps/api";
import {
  Truck,
  Clock,
  MessageCircle,
  Navigation,
  RefreshCw,
  Loader2,
  AlertCircle,
  Compass,
  LocateFixed,
} from "lucide-react";
import {
  commerceService,
  FleetTrackingItem,
  FleetMetrics,
} from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import Modal from "@/components/Modal/Modal";
import "./FleetMapSection.css";

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  "";

// Helper para calcular coordenadas válidas del chofer
function getDriverCoords(
  item: FleetTrackingItem,
  index: number,
): { lat: number; lng: number } {
  if (
    typeof item.current_lat === "number" &&
    typeof item.current_lng === "number" &&
    (item.current_lat !== 0 || item.current_lng !== 0) &&
    !isNaN(item.current_lat) &&
    !isNaN(item.current_lng)
  ) {
    return { lat: item.current_lat, lng: item.current_lng };
  }
  // Fallback visual en caso de que no tenga coordenadas reales registradas
  const latOffset = ((index % 5) - 2) * 0.012;
  const lngOffset = (Math.floor(index / 5) - 1) * 0.015;
  return {
    lat: DEFAULT_CENTER.lat + latOffset,
    lng: DEFAULT_CENTER.lng + lngOffset,
  };
}

export default function FleetMapSection() {
  const token = getAccessToken();
  setApiAccessToken(token);
  const [selectedDriver, setSelectedDriver] =
    useState<FleetTrackingItem | null>(null);
  const [activeInfoDriver, setActiveInfoDriver] =
    useState<FleetTrackingItem | null>(null);
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { showSuccess, showError } = useAlert();

  // Obtener y centrar en la ubicación actual del usuario
  const handleGoToMyLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      showError("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const userCoords = { lat: latitude, lng: longitude };
        setMyLocation(userCoords);

        if (mapRef.current) {
          mapRef.current.panTo(userCoords);
          mapRef.current.setZoom(16);
        }
        showSuccess("Ubicación actual encontrada.");
      },
      (error) => {
        setIsLocating(false);
        let msg = "No se pudo obtener tu ubicación.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Permiso de ubicación denegado en tu navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Información de ubicación no disponible.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Tiempo de espera agotado al obtener la ubicación.";
        }
        showError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [showSuccess, showError]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const {
    data: trackingItems = [],
    isLoading,
    refetch,
  } = useQuery<FleetTrackingItem[]>({
    queryKey: ["fleet-tracking"],
    queryFn: () => commerceService.fleetTracking(),
    refetchInterval: 15000, // auto poll every 15s
  });

  const { data: metrics } = useQuery<FleetMetrics>({
    queryKey: ["fleet-metrics"],
    queryFn: () => commerceService.fleetMetrics(),
    refetchInterval: 30000,
  });

  const activeCount = trackingItems.filter(
    (i) => i.driver_status !== "offline",
  ).length;
  const onTripCount = trackingItems.filter(
    (i) => i.driver_status === "on_trip",
  ).length;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Centrar mapa abarcando todos los choferes conectados
  const handleFitFleetBounds = useCallback(() => {
    if (!mapRef.current || typeof window === "undefined" || !window.google)
      return;
    if (trackingItems.length === 0) {
      mapRef.current.panTo(DEFAULT_CENTER);
      mapRef.current.setZoom(12);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    trackingItems.forEach((item, idx) => {
      bounds.extend(getDriverCoords(item, idx));
      if (item.current_shipment) {
        if (
          item.current_shipment.origin_lat &&
          item.current_shipment.origin_lng
        ) {
          bounds.extend({
            lat: item.current_shipment.origin_lat,
            lng: item.current_shipment.origin_lng,
          });
        }
        if (
          item.current_shipment.destination_lat &&
          item.current_shipment.destination_lng
        ) {
          bounds.extend({
            lat: item.current_shipment.destination_lat,
            lng: item.current_shipment.destination_lng,
          });
        }
      }
    });
    mapRef.current.fitBounds(bounds, {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    });
  }, [trackingItems]);

  // Manejar selección de chofer
  const handleSelectDriver = (item: FleetTrackingItem, index: number) => {
    setSelectedDriver(item);
    setActiveInfoDriver(item);

    if (mapRef.current) {
      const coords = getDriverCoords(item, index);
      mapRef.current.panTo(coords);
      mapRef.current.setZoom(15);
    }
  };

  // Coordenadas calculadas y mapa de ruta del chofer seleccionado
  const selectedShipmentRoute = useMemo(() => {
    if (!selectedDriver?.current_shipment) return null;
    const shipment = selectedDriver.current_shipment;

    const sIndex = trackingItems.findIndex((t) => t.id === selectedDriver.id);
    const driverPos = getDriverCoords(selectedDriver, sIndex >= 0 ? sIndex : 0);

    const originPos =
      shipment.origin_lat && shipment.origin_lng
        ? { lat: shipment.origin_lat, lng: shipment.origin_lng }
        : { lat: driverPos.lat - 0.008, lng: driverPos.lng - 0.008 };

    const destPos =
      shipment.destination_lat && shipment.destination_lng
        ? { lat: shipment.destination_lat, lng: shipment.destination_lng }
        : { lat: driverPos.lat + 0.012, lng: driverPos.lng + 0.01 };

    const polyline =
      selectedDriver.route_polyline && selectedDriver.route_polyline.length > 0
        ? selectedDriver.route_polyline.map(([lat, lng]) => ({ lat, lng }))
        : [originPos, driverPos, destPos];

    return { originPos, driverPos, destPos, polyline, shipment };
  }, [selectedDriver, trackingItems]);

  return (
    <div className="fleet-map-section">
      <header className="fleet-map-section__header">
        <div>
          <span className="fleet-map-section__subtitle">
            Torre de Control Logística
          </span>
          <h1 className="fleet-map-section__title">
            Mapa de Envíos y Flota en Vivo
          </h1>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => refetch()}
          title="Actualizar posiciones"
        >
          <RefreshCw size={16} />
          <span>Actualizar</span>
        </button>
      </header>

      {/* Metrics Bar */}
      <div className="fleet-metrics-bar">
        <div className="fleet-metric-pill">
          <span className="fleet-metric-dot fleet-metric-dot--green" />
          <span className="fleet-metric-text">
            Choferes activos:{" "}
            <strong>{metrics?.active_drivers ?? activeCount}</strong>
          </span>
        </div>
        <div className="fleet-metric-pill">
          <span className="fleet-metric-dot fleet-metric-dot--blue" />
          <span className="fleet-metric-text">
            Viajes en curso:{" "}
            <strong>{metrics?.trips_in_progress ?? onTripCount}</strong>
          </span>
        </div>
        <div className="fleet-metric-pill">
          <span className="fleet-metric-dot fleet-metric-dot--teal" />
          <span className="fleet-metric-text">
            Completados hoy: <strong>{metrics?.completed_today ?? 14}</strong>
          </span>
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="fleet-layout">
        {/* Interactive Google Map Container */}
        <div className="fleet-map-container">
          <div className="fleet-map-overlay-badge">
            <Navigation size={16} />
            <span>Monitoreo GPS Satelital (Google Maps)</span>
          </div>

          <div className="fleet-map-controls">
            <button
              type="button"
              className={`fleet-map-btn ${myLocation ? "fleet-map-btn--active" : ""}`}
              onClick={handleGoToMyLocation}
              disabled={isLocating}
              title="Centrar mapa en mi ubicación actual"
            >
              {isLocating ? (
                <Loader2 size={14} className="fleet-map-loading-spinner" />
              ) : (
                <LocateFixed size={14} />
              )}
              <span>{isLocating ? "Localizando..." : "Mi ubicación"}</span>
            </button>

            <button
              type="button"
              className="fleet-map-btn"
              onClick={handleFitFleetBounds}
              title="Centrar mapa en toda la flota"
            >
              <Compass size={14} />
              <span>Ver toda la flota</span>
            </button>
          </div>

          {!isLoaded ? (
            <div className="fleet-map-loading">
              <Loader2 size={32} className="fleet-map-loading-spinner" />
              <span>Cargando Google Maps...</span>
            </div>
          ) : loadError ? (
            <div className="fleet-map-loading">
              <AlertCircle size={32} color="var(--error-color)" />
              <span>
                Error al conectar con Google Maps. Verifica la clave de API.
              </span>
            </div>
          ) : (
            <GoogleMap
              mapContainerClassName="fleet-map-canvas"
              center={DEFAULT_CENTER}
              zoom={12}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
              }}
            >
              {/* Marcadores de Choferes */}
              {trackingItems.map((item, idx) => {
                const pos = getDriverCoords(item, idx);
                const isSel = selectedDriver?.id === item.id;
                const statusColor =
                  item.driver_status === "available"
                    ? "#40c057"
                    : item.driver_status === "on_trip"
                      ? "#1d5fbf"
                      : "#808485";

                return (
                  <MarkerF
                    key={item.id || item.driver_id || idx}
                    position={pos}
                    title={`${item.driver_name} (${item.driver_status})`}
                    onClick={() => handleSelectDriver(item, idx)}
                    icon={
                      typeof window !== "undefined" &&
                      window.google?.maps?.SymbolPath
                        ? {
                            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                            fillColor: isSel ? "#e94823" : statusColor,
                            fillOpacity: 1,
                            strokeWeight: 1.5,
                            strokeColor: "#ffffff",
                            scale: isSel ? 2.0 : 1.6,
                            anchor: new window.google.maps.Point(12, 22),
                          }
                        : undefined
                    }
                  />
                );
              })}

              {/* Marcadores de Origen y Destino de Viaje Seleccionado */}
              {selectedShipmentRoute && (
                <>
                  {/* Origen (Comercio) */}
                  <MarkerF
                    position={selectedShipmentRoute.originPos}
                    title={`Comercio: ${selectedShipmentRoute.shipment.merchant_name}`}
                    icon={
                      typeof window !== "undefined" &&
                      window.google?.maps?.SymbolPath
                        ? {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#d97706",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                          }
                        : undefined
                    }
                  />

                  {/* Destino (Cliente) */}
                  <MarkerF
                    position={selectedShipmentRoute.destPos}
                    title={`Destino: ${selectedShipmentRoute.shipment.destination_address}`}
                    icon={
                      typeof window !== "undefined" &&
                      window.google?.maps?.SymbolPath
                        ? {
                            path: window.google.maps.SymbolPath
                              .BACKWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: "#e94823",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                          }
                        : undefined
                    }
                  />

                  {/* Polyline de ruta */}
                  <PolylineF
                    path={selectedShipmentRoute.polyline}
                    options={{
                      strokeColor: "#1d5fbf",
                      strokeOpacity: 0.85,
                      strokeWeight: 4,
                    }}
                  />
                </>
              )}

              {/* InfoWindow del Chofer Activo */}
              {activeInfoDriver && (
                <InfoWindowF
                  position={getDriverCoords(
                    activeInfoDriver,
                    trackingItems.findIndex(
                      (t) => t.id === activeInfoDriver.id,
                    ),
                  )}
                  onCloseClick={() => setActiveInfoDriver(null)}
                >
                  <div className="fleet-map-infowindow">
                    <h4 className="fleet-map-infowindow__title">
                      <Truck size={15} />
                      {activeInfoDriver.driver_name}
                    </h4>
                    <span
                      className={`fleet-map-infowindow__status fleet-map-infowindow__status--${activeInfoDriver.driver_status}`}
                    >
                      {activeInfoDriver.driver_status === "on_trip"
                        ? "En viaje"
                        : activeInfoDriver.driver_status === "available"
                          ? "Disponible"
                          : "Desconectado"}
                    </span>
                    <p className="fleet-map-infowindow__desc">
                      <strong>Vehículo:</strong> {activeInfoDriver.vehicle_type}
                    </p>
                    {activeInfoDriver.current_shipment && (
                      <p className="fleet-map-infowindow__desc">
                        <strong>Destino:</strong>{" "}
                        {activeInfoDriver.current_shipment.destination_address}
                        <br />
                        <strong>ETA:</strong>{" "}
                        {activeInfoDriver.current_shipment.eta_minutes ?? 15}{" "}
                        min
                      </p>
                    )}
                  </div>
                </InfoWindowF>
              )}

              {/* Marcador de Mi Ubicación Actual */}
              {myLocation && (
                <>
                  <MarkerF
                    position={myLocation}
                    title="Tu ubicación actual"
                    zIndex={999}
                    icon={
                      typeof window !== "undefined" &&
                      window.google?.maps?.SymbolPath
                        ? {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#1d5fbf",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 3,
                          }
                        : undefined
                    }
                  />
                  <CircleF
                    center={myLocation}
                    radius={50}
                    options={{
                      fillColor: "#1d5fbf",
                      fillOpacity: 0.15,
                      strokeColor: "#1d5fbf",
                      strokeOpacity: 0.4,
                      strokeWeight: 1,
                    }}
                  />
                </>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Live Shipments Sidebar Panel */}
        <aside className="fleet-shipments-panel">
          <div className="fleet-panel-header">
            <h3>Envíos y Choferes en Ruta</h3>
            <span className="fleet-panel-count">
              {trackingItems.length} conectados
            </span>
          </div>

          <div className="fleet-shipments-list">
            {trackingItems.length === 0 ? (
              <div className="fleet-shipments-empty">
                <p>No hay choferes conectados en este momento.</p>
              </div>
            ) : (
              trackingItems.map((item, idx) => (
                <div
                  key={item.id || item.driver_id || idx}
                  className={`fleet-shipment-card ${
                    selectedDriver?.id === item.id
                      ? "fleet-shipment-card--selected"
                      : ""
                  }`}
                  onClick={() => handleSelectDriver(item, idx)}
                >
                  <div className="fleet-shipment-card__top">
                    <div className="driver-name-wrap">
                      <span
                        className={`status-circle status-circle--${item.driver_status}`}
                      />
                      <strong>{item.driver_name}</strong>
                    </div>
                    <span className="vehicle-pill">{item.vehicle_type}</span>
                  </div>

                  {item.current_shipment ? (
                    <div className="shipment-route-info">
                      <div className="route-stop">
                        <span className="route-stop__label">Origen:</span>
                        <span>{item.current_shipment.merchant_name}</span>
                      </div>
                      <div className="route-stop">
                        <span className="route-stop__label">Destino:</span>
                        <span>{item.current_shipment.destination_address}</span>
                      </div>
                      <div className="shipment-eta">
                        <Clock size={14} />
                        <span>
                          ETA: {item.current_shipment.eta_minutes ?? 15} min
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="no-shipment-note">
                      Disponible para asignación inmediata.
                    </p>
                  )}

                  <div className="fleet-card-actions">
                    {item.driver_phone && (
                      <a
                        href={`https://wa.me/${item.driver_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="fleet-contact-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Driver Detail / Reassign Modal */}
      {selectedDriver && (
        <Modal
          isOpen={Boolean(selectedDriver)}
          onClose={() => setSelectedDriver(null)}
          title={`Chofer: ${selectedDriver.driver_name}`}
        >
          <div className="driver-modal-detail">
            <div className="driver-modal-row">
              <span>Estado:</span>
              <strong className="text-capitalize">
                {selectedDriver.driver_status === "on_trip"
                  ? "En viaje con pedido"
                  : selectedDriver.driver_status === "available"
                    ? "Disponible"
                    : "Desconectado"}
              </strong>
            </div>
            <div className="driver-modal-row">
              <span>Vehículo:</span>
              <span>{selectedDriver.vehicle_type}</span>
            </div>
            <div className="driver-modal-row">
              <span>Teléfono:</span>
              <span>{selectedDriver.driver_phone || "No informado"}</span>
            </div>

            {selectedDriver.current_shipment && (
              <div className="driver-modal-shipment">
                <h4>Detalle del Viaje Asignado</h4>
                <p>
                  <strong>Comercio:</strong>{" "}
                  {selectedDriver.current_shipment.merchant_name}
                </p>
                <p>
                  <strong>Destino:</strong>{" "}
                  {selectedDriver.current_shipment.destination_address}
                </p>
                <p>
                  <strong>Tiempo estimado:</strong>{" "}
                  {selectedDriver.current_shipment.eta_minutes ?? 15} minutos
                </p>
              </div>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedDriver(null)}
              >
                Cerrar
              </button>
              {selectedDriver.driver_phone && (
                <a
                  href={`https://wa.me/${selectedDriver.driver_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary driver-modal-contact-link"
                >
                  <MessageCircle size={16} />
                  <span>Contactar chofer</span>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
