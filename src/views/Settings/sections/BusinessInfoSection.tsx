import ChoicePills from "./ChoicePills";

export default function BusinessInfoSection({
  businessType,
  setBusinessType,
  tradeName,
  setTradeName,
  cuit,
  setCuit,
}) {
  return (
    <article className="settings-card settings-card--wide business-info-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">💼</span>
          <h2>Información comercial</h2>
        </div>
      </div>

      <div className="settings-fields two-columns">
        <label className="settings-field">
          <span>
            Nombre comercial <span style={{ color: "var(--error-color, #fa5252)", fontWeight: "bold" }}>* (Obligatorio)</span>
          </span>
          <input
            type="text"
            required
            placeholder="Ingresá el nombre comercial"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
          />
        </label>
      </div>

      <div className="settings-fields two-columns">
        <label className="settings-field">
          <span>
            CUIT / CUIL <span style={{ color: "var(--error-color, #fa5252)", fontWeight: "bold" }}>* (Obligatorio)</span>
          </span>
          <input
            type="text"
            required
            placeholder="Ingresá el CUIT / CUIL"
            value={cuit}
            onChange={(e) => setCuit(e.target.value)}
          />
        </label>
      </div>

      <div className="settings-fields two-columns settings-fields-top-space">
        <div className="settings-field">
          <span>Tipo de actividad</span>
          <ChoicePills
            value={businessType}
            onChange={setBusinessType}
            options={[
              { value: "company", label: "Empresa" },
              { value: "individual", label: "Autónomo" },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
