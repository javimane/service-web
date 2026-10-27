"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
): { lat: number; lng: number } | null {
  if (
    typeof item.current_lat === "number" &&
    typeof item.current_lng === "number" &&
    (item.current_lat !== 0 || item.current_lng !== 0) &&
    !isNaN(item.current_lat) &&
    !isNaN(item.current_lng)
  ) {
    return { lat: item.current_lat, lng: item.current_lng };
  }
  return null;
}

const LOCATION_FRESHNESS_MS = 120_000;

function getLiveDriverStatus(
  item: FleetTrackingItem,
  now: number,
): FleetTrackingItem["driver_status"] {
  const locationTime = item.last_location_update
    ? Date.parse(item.last_location_update)
    : NaN;
  const hasRecentLocation =
    Number.isFinite(locationTime) &&
    now >= locationTime &&
    now - locationTime < LOCATION_FRESHNESS_MS;
  return item.driver_status !== "offline" && hasRecentLocation
    ? item.driver_status
    : "offline";
}

export default function FleetMapSection() {
  const token = getAccessToken();
  setApiAccessToken(token);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [activeInfoDriverId, setActiveInfoDriverId] = useState<string | null>(
    null,
  );
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [now, setNow] = useState(() => Date.now());
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

  const { data: fetchedTrackingItems = [], refetch } = useQuery<
    FleetTrackingItem[]
  >({
    queryKey: ["fleet-tracking"],
    queryFn: () => commerceService.fleetTracking(),
    refetchInterval: 15000, // auto poll every 15s
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const trackingItems = useMemo(
    () =>
      fetchedTrackingItems.map((item) => ({
        ...item,
        driver_status: getLiveDriverStatus(item, now),
      })),
    [fetchedTrackingItems, now],
  );
  const selectedDriver =
    trackingItems.find((item) => item.id === selectedDriverId) ?? null;
  const activeInfoDriver =
    trackingItems.find((item) => item.id === activeInfoDriverId) ?? null;

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
    const bounds = new window.google.maps.LatLngBounds();
    let hasBounds = false;
    trackingItems.forEach((item) => {
      if (item.driver_status === "offline") return;
      const coords = getDriverCoords(item);
      if (coords) {
        bounds.extend(coords);
        hasBounds = true;
      }
      if (item.current_shipment) {
        if (
          item.current_shipment.origin_lat &&
          item.current_shipment.origin_lng
        ) {
          bounds.extend({
            lat: item.current_shipment.origin_lat,
            lng: item.current_shipment.origin_lng,
          });
          hasBounds = true;
        }
        if (
          item.current_shipment.destination_lat &&
          item.current_shipment.destination_lng
        ) {
          bounds.extend({
            lat: item.current_shipment.destination_lat,
            lng: item.current_shipment.destination_lng,
          });
          hasBounds = true;
        }
      }
    });
    if (!hasBounds) {
      mapRef.current.panTo(DEFAULT_CENTER);
      mapRef.current.setZoom(12);
      return;
    }
    mapRef.current.fitBounds(bounds, {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    });
  }, [trackingItems]);

  // Manejar selección de chofer
  const handleSelectDriver = (item: FleetTrackingItem) => {
    setSelectedDriverId(item.id);
    setActiveInfoDriverId(item.id);

    if (mapRef.current) {
      const coords = getDriverCoords(item);
      if (coords) {
        mapRef.current.panTo(coords);
        mapRef.current.setZoom(15);
      }
    }
  };

  // Coordenadas calculadas y mapa de ruta del chofer seleccionado
  const selectedShipmentRoute = useMemo(() => {
    if (!selectedDriver?.current_shipment) return null;
    const shipment = selectedDriver.current_shipment;

    const driverPos = getDriverCoords(selectedDriver);
    if (!driverPos || selectedDriver.driver_status === "offline") return null;

    const originPos =
      shipment.origin_lat && shipment.origin_lng
        ? { lat: shipment.origin_lat, lng: shipment.origin_lng }
        : null;

    const destPos =
      shipment.destination_lat && shipment.destination_lng
        ? { lat: shipment.destination_lat, lng: shipment.destination_lng }
        : null;

    const polyline =
      selectedDriver.route_polyline && selectedDriver.route_polyline.length > 0
        ? selectedDriver.route_polyline.map(([lat, lng]) => ({ lat, lng }))
        : [originPos, driverPos, destPos].filter(
            (point): point is { lat: number; lng: number } => point !== null,
          );

    return { originPos, driverPos, destPos, polyline, shipment };
  }, [selectedDriver]);

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
            Choferes activos: <strong>{activeCount}</strong>
          </span>
        </div>
        <div className="fleet-metric-pill">
          <span className="fleet-metric-dot fleet-metric-dot--blue" />
          <span className="fleet-metric-text">
            Viajes en curso: <strong>{onTripCount}</strong>
          </span>
        </div>
        <div className="fleet-metric-pill">
          <span className="fleet-metric-dot fleet-metric-dot--teal" />
          <span className="fleet-metric-text">
            Completados hoy: <strong>{metrics?.completed_today ?? "—"}</strong>
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
              {trackingItems.map((item) => {
                if (item.driver_status === "offline") return null;
                const pos = getDriverCoords(item);
                if (!pos) return null;
                const isSel = selectedDriver?.id === item.id;

                return (
                  <MarkerF
                    key={item.id || item.driver_id}
                    position={pos}
                    title={`${item.driver_name} (${item.driver_status})`}
                    onClick={() => handleSelectDriver(item)}
                    zIndex={isSel ? 99 : 10}
                    icon={
                      typeof window !== "undefined" && window.google?.maps?.Size
                        ? {
                            url: "/Van.png",
                            scaledSize: isSel
                              ? new window.google.maps.Size(54, 44)
                              : new window.google.maps.Size(44, 36),
                            anchor: isSel
                              ? new window.google.maps.Point(27, 22)
                              : new window.google.maps.Point(22, 18),
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
                  {selectedShipmentRoute.originPos && (
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
                  )}

                  {/* Destino (Cliente) */}
                  {selectedShipmentRoute.destPos && (
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
                  )}

                  {/* Polyline de ruta */}
                  {selectedShipmentRoute.polyline.length > 1 && (
                    <PolylineF
                      path={selectedShipmentRoute.polyline}
                      options={{
                        strokeColor: "#1d5fbf",
                        strokeOpacity: 0.85,
                        strokeWeight: 4,
                      }}
                    />
                  )}
                </>
              )}

              {/* InfoWindow del Chofer Activo */}
              {activeInfoDriver &&
                activeInfoDriver.driver_status !== "offline" &&
                getDriverCoords(activeInfoDriver) && (
                  <InfoWindowF
                    position={getDriverCoords(activeInfoDriver)!}
                    onCloseClick={() => setActiveInfoDriverId(null)}
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
                        <strong>Vehículo:</strong>{" "}
                        {activeInfoDriver.vehicle_type}
                      </p>
                      {activeInfoDriver.current_shipment && (
                        <p className="fleet-map-infowindow__desc">
                          <strong>Destino:</strong>{" "}
                          {
                            activeInfoDriver.current_shipment
                              .destination_address
                          }
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
            <span className="fleet-panel-count">{activeCount} conectados</span>
          </div>

          <div className="fleet-shipments-list">
            {trackingItems.length === 0 ? (
              <div className="fleet-shipments-empty">
                <p>No hay choferes conectados en este momento.</p>
              </div>
            ) : (
              trackingItems.map((item) => (
                <div
                  key={item.id || item.driver_id}
                  className={`fleet-shipment-card ${
                    selectedDriver?.id === item.id
                      ? "fleet-shipment-card--selected"
                      : ""
                  }`}
                  onClick={() => handleSelectDriver(item)}
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

                  <span
                    className={`fleet-shipment-card__connection fleet-shipment-card__connection--${item.driver_status}`}
                  >
                    {item.driver_status === "on_trip"
                      ? "Conectado · en viaje"
                      : item.driver_status === "available"
                        ? "Conectado · disponible"
                        : "Desconectado"}
                  </span>

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
                    <p
                      className={`no-shipment-note${item.driver_status === "offline" ? " no-shipment-note--offline" : ""}`}
                    >
                      {item.driver_status === "available"
                        ? "Disponible para asignación inmediata."
                        : "No disponible para asignación inmediata."}
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
          onClose={() => setSelectedDriverId(null)}
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
                onClick={() => setSelectedDriverId(null)}
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
