"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import ChoicePills from "./ChoicePills";
import GoogleMapPickerModal, { type GoogleAddressResult } from "@/components/GoogleMapPickerModal/GoogleMapPickerModal";
import { getDepartmentsAction } from "@/app/actions/locations";
import { AlertTriangle, Map } from "lucide-react";
import "./OperationsSection.css";

type Province = {
  id: number;
  name: string;
};

const normalizeLocation = (value: string) => value.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")
  .replace(/^(provincia de |departamento de |partido de )/, "").trim();

type Department = {
  id: number;
  name: string;
};

type OperationsSectionProps = {
  hasStorefront: string;
  setHasStorefront: (value: string) => void;
  provinceList?: Province[];
  departmentList?: Department[];
  storeStreet: string;
  setStoreStreet: (value: string) => void;
  storeNumber: string;
  setStoreNumber: (value: string) => void;
  storeFloor: string;
  setStoreFloor: (value: string) => void;
  storeZip: string;
  setStoreZip: (value: string) => void;
  storeProvinceId: number | null;
  setStoreProvinceId: (value: number | null) => void;
  storeDepartmentId: number | null;
  setStoreDepartmentId: (value: number | null) => void;
  storeLat: number | null;
  setStoreLat: (value: number | null) => void;
  storeLng: number | null;
  setStoreLng: (value: number | null) => void;
};

export default function OperationsSection({
  hasStorefront,
  setHasStorefront,
  provinceList = [],
  departmentList = [],
  storeStreet,
  setStoreStreet,
  storeNumber,
  setStoreNumber,
  storeFloor,
  setStoreFloor,
  storeZip,
  setStoreZip,
  storeProvinceId,
  setStoreProvinceId,
  storeDepartmentId,
  setStoreDepartmentId,
  storeLat,
  setStoreLat,
  storeLng,
  setStoreLng,
}: OperationsSectionProps) {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const addressRevision = useRef(0);
  const provinces = provinceList as Province[];
  const departments = departmentList as Department[];

  const handleMapSelect = async (address: GoogleAddressResult) => {
    const revision = ++addressRevision.current;
    setStoreLat(address.lat);
    setStoreLng(address.lng);
    setStoreStreet(address.street);
    setStoreNumber(address.number);
    setStoreZip(address.postalCode);
    setStoreFloor("");
    setStoreDepartmentId(null);
    const province = provinces.find((item) => normalizeLocation(item.name) === normalizeLocation(address.province));
    setStoreProvinceId(province?.id ?? null);
    if (!province) return;
    try {
      const result = await getDepartmentsAction({ provinceId: province.id });
      if (addressRevision.current !== revision) return;
      const department = result?.data?.find((item: Department) =>
        normalizeLocation(item.name) === normalizeLocation(address.department));
      setStoreDepartmentId(department?.id ?? null);
    } catch {
      // Keep manual selection available when the location catalogue cannot be loaded.
    }
  };

  return (
    <article className="settings-card operations-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">🏪</span>
          <h2>Operaciones</h2>
        </div>
      </div>

      <div className="settings-fields">
        <div className="settings-field">
          <span>¿Tiene comercio al público?</span>
          <div className="operations-section__product-warning" role="note">
            <AlertTriangle size={22} aria-hidden="true" />
            <p><strong>Obligatorio si vendés productos.</strong> Marcá «Sí» y completá la dirección y ubicación del local para registrar tu sucursal principal. Para vender productos necesitás una sucursal principal o al menos una sucursal registrada; sin una sucursal no podés vender.</p>
          </div>
          <ChoicePills
            value={hasStorefront}
            onChange={setHasStorefront}
            options={[
              { value: "si", label: "Sí" },
              { value: "no", label: "No" },
            ]}
          />
        </div>

        {hasStorefront === "si" && (
          <div className="settings-fields storefront-grid settings-fields-top-space">
            <label className="settings-field">
              <span>Calle</span>
              <input
                type="text"
                placeholder="Calle"
                value={storeStreet}
                onChange={(e) => setStoreStreet(e.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>Número</span>
              <input
                type="text"
                placeholder="Número"
                value={storeNumber}
                onChange={(e) => setStoreNumber(e.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>Piso / Depto</span>
              <input
                type="text"
                placeholder="Ej: 2B"
                value={storeFloor}
                onChange={(e) => setStoreFloor(e.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>Código postal</span>
              <input
                type="text"
                placeholder="CP"
                value={storeZip}
                onChange={(e) => setStoreZip(e.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>Provincia</span>
              <div className="select-wrapper">
                <select
                  value={storeProvinceId || ""}
                  onChange={(e) => {
                    addressRevision.current++;
                    const id = Number(e.target.value);
                    setStoreProvinceId(id);
                    setStoreDepartmentId(null);
                  }}
                >
                  <option value="" disabled>
                    Seleccioná una provincia
                  </option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">⌄</span>
              </div>
            </label>
            <label className="settings-field">
              <span>Departamento</span>
              <div className="select-wrapper">
                <select
                  value={storeDepartmentId || ""}
                  onChange={(e) => {
                    addressRevision.current++;
                    setStoreDepartmentId(Number(e.target.value));
                  }}
                  disabled={!storeProvinceId}
                >
                  <option value="" disabled>
                    {storeProvinceId
                      ? "Seleccioná un departamento"
                      : "Primero provincia"}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">⌄</span>
              </div>
            </label>

            <div className="settings-field--full coordinates-group">
              <div className="coordinates-header">
                <div className="coordinates-title-wrap">
                  <span className="coordinates-title">
                    Coordenadas Geográficas <span className="required-star">*</span>
                  </span>
                  <p className="coordinates-note">
                    Buscá la calle y el número en Google Maps o mové el pin. Se completarán la dirección y las coordenadas; revisá la provincia y el departamento antes de guardar.
                  </p>
                </div>
                <button
                  type="button"
                  className={`map-open-btn ${!storeLat || !storeLng ? "map-open-btn--required" : ""}`}
                  onClick={() => setMapModalOpen(true)}
                >
                  <Map size={16} />
                  {storeLat && storeLng
                    ? "Ubicación seleccionada ✓"
                    : "Buscar dirección en Google Maps"}
                </button>
              </div>

              {(!storeLat || !storeLng) && (
                <div className="coordinates-required-alert">
                  ⚠️ Es obligatorio seleccionar la ubicación en el mapa al tener comercio al público.
                </div>
              )}

              <div className="coordinates-inputs">
                <label className="settings-field">
                  <span>Latitud</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="-34.6037"
                    value={storeLat || ""}
                    onChange={(e) =>
                      setStoreLat(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </label>
                <label className="settings-field">
                  <span>Longitud</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="-58.3816"
                    value={storeLng || ""}
                    onChange={(e) =>
                      setStoreLng(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {mapModalOpen && createPortal(<GoogleMapPickerModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onSelectAddress={handleMapSelect}
        initialLat={storeLat}
        initialLng={storeLng}
      />, document.body)}
    </article>
  );
}
