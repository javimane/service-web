import ChoicePills from "./ChoicePills";

export default function BusinessInfoSection({
  businessType,
  setBusinessType,
  tradeName,
  setTradeName,
}) {
  return (
    <article className="settings-card settings-card--wide">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">💼</span>
          <h2>Business Information</h2>
        </div>
      </div>

      <div className="settings-fields two-columns">
        <label className="settings-field">
          <span>Nombre comercial</span>
          <input
            type="text"
            placeholder="Ingresá el nombre comercial"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
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
              { value: "Empresa", label: "Empresa" },
              { value: "Autónomo", label: "Autónomo" },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
