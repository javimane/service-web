import ChoicePills from "./ChoicePills";

export default function BusinessInfoSection({
  businessType,
  setBusinessType,
  isRegistered,
  setIsRegistered,
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
          <span>Nombre</span>
          <input type="text" placeholder="Ingresá tu nombre" />
        </label>
        <label className="settings-field">
          <span>Nombre comercial</span>
          <input type="text" placeholder="Ingresá el nombre comercial" />
        </label>
      </div>

      <div className="settings-fields two-columns settings-fields-top-space">
        <div className="settings-field">
          <span>Tipo de actividad</span>
          <ChoicePills
            value={businessType}
            onChange={setBusinessType}
            options={[
              { value: "empresa", label: "Empresa" },
              { value: "autonomo", label: "Autónomo" },
            ]}
          />
        </div>

        <div className="settings-field">
          <span>¿Es matriculado?</span>
          <ChoicePills
            value={isRegistered}
            onChange={setIsRegistered}
            options={[
              { value: "si", label: "Sí" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
