import ChoicePills from "./ChoicePills";

export default function OperationsSection({
  hasStorefront,
  setHasStorefront,
  provinceOptions,
  departmentOptions,
}) {
  return (
    <article className="settings-card">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">🏪</span>
          <h2>Operations</h2>
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
              <input type="text" placeholder="Calle" />
            </label>
            <label className="settings-field">
              <span>Número</span>
              <input type="text" placeholder="Número" />
            </label>
            <label className="settings-field">
              <span>Código postal</span>
              <input type="text" placeholder="Código postal" />
            </label>
            <label className="settings-field">
              <span>Provincia</span>
              <div className="select-wrapper">
                <select defaultValue="">
                  <option value="" disabled>
                    Seleccioná una provincia
                  </option>
                  {provinceOptions.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">⌄</span>
              </div>
            </label>
            <label className="settings-field settings-field--full">
              <span>Departamento</span>
              <div className="select-wrapper">
                <select defaultValue="">
                  <option value="" disabled>
                    Seleccioná un departamento
                  </option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">⌄</span>
              </div>
            </label>
          </div>
        )}
      </div>
    </article>
  );
}
