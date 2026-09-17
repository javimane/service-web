"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Truck,
  Car,
  Clock,
  Phone,
  MessageCircle,
  Users,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import {
  commerceService,
  FleetTrackingItem,
  FleetMetrics,
} from "@/services/commerceService";
import Modal from "@/components/Modal/Modal";
import "./FleetMapSection.css";

export default function FleetMapSection() {
  const [selectedDriver, setSelectedDriver] = useState<FleetTrackingItem | null>(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const {
    data: trackingItems = [],
    isLoading,
    isError,
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

  // Calculate metrics fallback
  const activeCount = trackingItems.filter((i) => i.driver_status !== "offline").length;
  const onTripCount = trackingItems.filter((i) => i.driver_status === "on_trip").length;

  return (
    <div className="fleet-map-section">
      <header className="fleet-map-section__header">
        <div>
          <span className="fleet-map-section__subtitle">Torre de Control Logística</span>
          <h1 className="fleet-map-section__title">Mapa de Envíos y Flota en Vivo</h1>
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
            Choferes activos: <strong>{metrics?.active_drivers ?? activeCount}</strong>
          </span>
        </div>
        <div className="fleet-metric-pill">
          <span className="fleet-metric-dot fleet-metric-dot--blue" />
          <span className="fleet-metric-text">
            Viajes en curso: <strong>{metrics?.trips_in_progress ?? onTripCount}</strong>
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
        {/* Interactive Map Visual */}
        <div className="fleet-map-container">
          <div className="fleet-map-overlay-badge">
            <Navigation size={16} />
            <span>Monitoreo GPS Satelital</span>
          </div>

          <div className="fleet-map-canvas">
            {/* Visual mock or interactive pins */}
            {trackingItems.map((item, index) => {
              // Distribute pins visually across canvas
              const top = 25 + (index * 22) % 65;
              const left = 20 + (index * 26) % 70;

              return (
                <div
                  key={item.id || item.driver_id}
                  className={`fleet-driver-pin fleet-driver-pin--${item.driver_status}`}
                  style={{ top: `${top}%`, left: `${left}%` }}
                  onClick={() => setSelectedDriver(item)}
                  title={`${item.driver_name} (${item.driver_status})`}
                >
                  <Truck size={16} />
                  <span className="fleet-driver-pin__tag">
                    {item.driver_name.split(" ")[0]}
                  </span>
                </div>
              );
            })}

            {/* Simulated Origin/Destination Markers for current shipment */}
            <div className="fleet-origin-pin" style={{ top: "35%", left: "40%" }}>
              <div className="pin-circle pin-circle--origin">C</div>
              <span className="pin-tag">Comercio Origen</span>
            </div>

            <div className="fleet-dest-pin" style={{ top: "60%", left: "68%" }}>
              <div className="pin-circle pin-circle--dest">D</div>
              <span className="pin-tag">Entrega Cliente</span>
            </div>

            {/* Polyline Route visual */}
            <svg className="fleet-route-svg">
              <line
                x1="40%"
                y1="35%"
                x2="68%"
                y2="60%"
                stroke="var(--brand-blue)"
                strokeWidth="3"
                strokeDasharray="6,6"
              />
            </svg>
          </div>
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
              trackingItems.map((item) => (
                <div
                  key={item.id || item.driver_id}
                  className={`fleet-shipment-card ${
                    selectedDriver?.id === item.id
                      ? "fleet-shipment-card--selected"
                      : ""
                  }`}
                  onClick={() => setSelectedDriver(item)}
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
                        <span>ETA: {item.current_shipment.eta_minutes ?? 15} min</span>
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
                  className="btn-primary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}
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
