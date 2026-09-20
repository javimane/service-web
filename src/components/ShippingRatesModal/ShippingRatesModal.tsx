"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Bike,
  Car,
  Package,
  Clock,
  ShieldCheck,
  Calculator,
  Loader2,
  Info,
  Layers,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import {
  commerceService,
  PlatformShippingRate,
} from "@/services/commerceService";
import "./ShippingRatesModal.css";

interface ShippingRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ShippingRatesModal({
  isOpen,
  onClose,
  title = "Costos de Envíos de la Plataforma",
}: ShippingRatesModalProps) {
  const [simKm, setSimKm] = useState<number>(5);
  const [simWeightKg, setSimWeightKg] = useState<number>(2);
  const [isNightSim, setIsNightSim] = useState<boolean>(false);

  const { data: rates, isLoading } = useQuery<PlatformShippingRate[]>({
    queryKey: ["platform-shipping-rates"],
    queryFn: async () => {
      const res = await commerceService.shippingRates();
      return Array.isArray(res) ? res : [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  if (!isOpen) return null;

  const defaultRates: PlatformShippingRate[] =
    rates && rates.length > 0
      ? rates
      : [
          {
            id: 1,
            vehicle_code: "bicycle",
            name: "Bicicleta",
            price_per_km: 600,
            min_price_first_km: 1500,
            night_price_per_km: 850,
            extra_price_per_kg: 100,
            max_weight_kg: 15,
            is_active: true,
          },
          {
            id: 2,
            vehicle_code: "motorcycle",
            name: "Moto / Ciclomotor",
            price_per_km: 800,
            min_price_first_km: 1500,
            night_price_per_km: 1100,
            extra_price_per_kg: 150,
            max_weight_kg: 30,
            is_active: true,
          },
          {
            id: 3,
            vehicle_code: "car",
            name: "Auto / Sedán",
            price_per_km: 1200,
            min_price_first_km: 2000,
            night_price_per_km: 1600,
            extra_price_per_kg: 200,
            max_weight_kg: 150,
            is_active: true,
          },
          {
            id: 4,
            vehicle_code: "van",
            name: "Camioneta / Utilitario",
            price_per_km: 2000,
            min_price_first_km: 3500,
            night_price_per_km: 2600,
            extra_price_per_kg: 300,
            max_weight_kg: 1000,
            is_active: true,
          },
          {
            id: 5,
            vehicle_code: "truck",
            name: "Camión de Carga (Vehículo Pesado)",
            price_per_km: 3500,
            min_price_first_km: 6000,
            night_price_per_km: 4500,
            extra_price_per_kg: 500,
            max_weight_kg: 5000,
            is_active: true,
          },
        ];

  // Simulation calculation
  const getSimulatedVehicle = (weight: number, km: number) => {
    if (weight <= 15 && km <= 8) return "bicycle";
    if (weight <= 30) return "motorcycle";
    if (weight <= 150) return "car";
    if (weight <= 1000) return "van";
    return "truck";
  };

  const simVehicleCode = getSimulatedVehicle(simWeightKg, simKm);
  const activeSimRate =
    defaultRates.find((r) => r.vehicle_code === simVehicleCode) ||
    defaultRates[1];

  const ratePerKm = isNightSim
    ? Number(activeSimRate.night_price_per_km)
    : Number(activeSimRate.price_per_km);
  const minCost = Number(activeSimRate.min_price_first_km || 1500);
  const distanceCost = Math.max(minCost, simKm * ratePerKm);

  let extraWeightCost = 0;
  if (simWeightKg > Number(activeSimRate.max_weight_kg)) {
    extraWeightCost =
      (simWeightKg - Number(activeSimRate.max_weight_kg)) *
      Number(activeSimRate.extra_price_per_kg || 0);
  } else if (
    (simVehicleCode === "truck" || simVehicleCode === "van") &&
    simWeightKg > 50
  ) {
    extraWeightCost =
      (simWeightKg - 50) * Number(activeSimRate.extra_price_per_kg || 0);
  }

  const totalSimCost = Math.round(distanceCost + extraWeightCost);

  const getVehicleIcon = (code: string) => {
    switch (code) {
      case "bicycle":
        return <Bike size={18} />;
      case "motorcycle":
        return <Bike size={18} />;
      case "car":
        return <Car size={18} />;
      case "van":
      case "truck":
      default:
        return <Truck size={18} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="shipping-rates-modal">
        {/* Header Hero */}
        <div className="shipping-rates-modal__hero">
          <div className="shipping-rates-modal__hero-icon">
            <Truck size={28} />
          </div>
          <div className="shipping-rates-modal__hero-info">
            <h3 className="shipping-rates-modal__hero-title">
              Tarifario de Envíos sin Riders Propios
            </h3>
            <p className="shipping-rates-modal__hero-subtitle">
              Costos oficiales aplicables cuando ofrecés <strong>Envío Gratis</strong>{" "}
              y los repartos son realizados por los riders y transportistas de la
              red de la plataforma.
            </p>
          </div>
        </div>

        {/* Rates Table */}
        <div className="shipping-rates-modal__table-wrap">
          {isLoading ? (
            <div className="shipping-rates-modal__loading">
              <Loader2 className="animate-spin" size={24} />
              <span>Cargando tarifario oficial...</span>
            </div>
          ) : (
            <table className="shipping-rates-modal__table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th className="shipping-rates-modal__th-right">Carga Máx.</th>
                  <th className="shipping-rates-modal__th-right">Mínimo (1er Km)</th>
                  <th className="shipping-rates-modal__th-right">Precio / Km</th>
                  <th className="shipping-rates-modal__th-right">Km Nocturno</th>
                  <th className="shipping-rates-modal__th-right">Adicional / Kg</th>
                </tr>
              </thead>
              <tbody>
                {defaultRates.map((rate) => {
                  const isAssigned = rate.vehicle_code === simVehicleCode;
                  return (
                    <tr
                      key={rate.vehicle_code}
                      className={
                        isAssigned ? "shipping-rates-modal__row--active" : ""
                      }
                    >
                      <td className="shipping-rates-modal__cell-vehicle">
                        <div className="shipping-rates-modal__vehicle-wrap">
                          <span className="shipping-rates-modal__vehicle-icon">
                            {getVehicleIcon(rate.vehicle_code)}
                          </span>
                          <div>
                            <strong>{rate.name}</strong>
                            <span className="shipping-rates-modal__vehicle-code">
                              {rate.vehicle_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="shipping-rates-modal__td-right">
                        Hasta {rate.max_weight_kg} kg
                      </td>
                      <td className="shipping-rates-modal__td-right shipping-rates-modal__td-min">
                        ${Number(rate.min_price_first_km).toLocaleString("es-AR")}
                      </td>
                      <td className="shipping-rates-modal__td-right">
                        ${Number(rate.price_per_km).toLocaleString("es-AR")}
                      </td>
                      <td className="shipping-rates-modal__td-right shipping-rates-modal__td-night">
                        ${Number(rate.night_price_per_km).toLocaleString("es-AR")}
                      </td>
                      <td className="shipping-rates-modal__td-right">
                        {Number(rate.extra_price_per_kg) > 0
                          ? `+$${Number(rate.extra_price_per_kg).toLocaleString(
                              "es-AR"
                            )}`
                          : "Bonificado"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Live Simulator */}
        <div className="shipping-rates-modal__sim-card">
          <div className="shipping-rates-modal__sim-title">
            <Calculator size={18} />
            <span>Simulador de Costo de Envío por Distancia y Peso</span>
          </div>

          <div className="shipping-rates-modal__sim-controls">
            <div className="shipping-rates-modal__sim-field">
              <label>Distancia estimada (km):</label>
              <input
                type="number"
                min="1"
                max="100"
                value={simKm}
                onChange={(e) => setSimKm(Math.max(1, Number(e.target.value)))}
                className="shipping-rates-modal__sim-input"
              />
            </div>

            <div className="shipping-rates-modal__sim-field">
              <label>Peso del paquete (kg):</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                max="5000"
                value={simWeightKg}
                onChange={(e) =>
                  setSimWeightKg(Math.max(0.5, Number(e.target.value)))
                }
                className="shipping-rates-modal__sim-input"
              />
            </div>

            <div className="shipping-rates-modal__sim-field shipping-rates-modal__sim-field--checkbox">
              <label className="shipping-rates-modal__checkbox-label">
                <input
                  type="checkbox"
                  checked={isNightSim}
                  onChange={(e) => setIsNightSim(e.target.checked)}
                />
                <span>Horario Nocturno (20 a 06 hs)</span>
              </label>
            </div>
          </div>

          {/* Simulation Output */}
          <div className="shipping-rates-modal__sim-result">
            <div className="shipping-rates-modal__sim-vehicle-tag">
              {getVehicleIcon(simVehicleCode)}
              <span>
                Vehículo Asignado: <strong>{activeSimRate.name}</strong>
              </span>
            </div>
            <div className="shipping-rates-modal__sim-price-tag">
              <span>Costo estimado:</span>
              <strong>${totalSimCost.toLocaleString("es-AR")}</strong>
            </div>
          </div>
        </div>

        {/* Info callout */}
        <div className="shipping-rates-modal__callout">
          <Info size={18} className="shipping-rates-modal__callout-icon" />
          <div className="shipping-rates-modal__callout-body">
            <strong>¿Quién asume este costo?</strong>
            <p>
              Si el producto tiene <strong>Envío Gratis</strong> activado por vos,
              el comprador paga $0 de envío y este importe se deduce del pago que
              recibís por la venta. Si tu comercio cuenta con riders propios,
              podés gestionar los pedidos con tu propia flota sin incurrir en este
              costo de plataforma.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shipping-rates-modal__footer">
          <button
            type="button"
            className="shipping-rates-modal__btn-close"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
