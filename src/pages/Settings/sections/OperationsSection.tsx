import { useState } from "react";
import ChoicePills from "./ChoicePills";
import MapPickerModal from "../../../components/MapPickerModal/MapPickerModal";
import { Map } from "lucide-react";

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
}) {
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const handleMapSelect = (lat: number, lng: number) => {
    setStoreLat(lat);
    setStoreLng(lng);
  };

  return (
    <article className="settings-card">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">🏪</span>
          <h2>Operaciones</h2>
        </div>
      </div>

      <div className="settings-fields">
        <div className="settings-field">
          <span>¿Tiene comercio al público?</span>
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
                    const id = Number(e.target.value);
                    setStoreProvinceId(id);
                    setStoreDepartmentId(null); 
                  }}
                >
                  <option value="" disabled>
                    Seleccioná una provincia
                  </option>
                  {provinceList.map((province) => (
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
                  onChange={(e) => setStoreDepartmentId(Number(e.target.value))}
                  disabled={!storeProvinceId}
                >
                  <option value="" disabled>
                    {storeProvinceId ? "Seleccioná un departamento" : "Primero provincia"}
                  </option>
                  {departmentList.map((department) => (
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
                  <span className="coordinates-title">Coordenadas Geográficas</span>
                  <p className="coordinates-note">
                    Ubicación precisa de tu comercio en el mapa.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="map-open-btn"
                  onClick={() => setMapModalOpen(true)}
                >
                  <Map size={16} />
                  Seleccionar en mapa
                </button>
              </div>

              <div className="coordinates-inputs">
                <label className="settings-field">
                  <span>Latitud</span>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="-34.6037" 
                    value={storeLat || ""}
                    onChange={(e) => setStoreLat(e.target.value ? Number(e.target.value) : null)}
                  />
                </label>
                <label className="settings-field">
                  <span>Longitud</span>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="-58.3816" 
                    value={storeLng || ""}
                    onChange={(e) => setStoreLng(e.target.value ? Number(e.target.value) : null)}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <MapPickerModal 
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onSelect={handleMapSelect}
        initialLat={storeLat}
        initialLng={storeLng}
      />
    </article>
  );
}
