import MultiChoiceChips from "./MultiChoiceChips";

export default function HeadquartersSection({
  selectedProvinces,
  onToggleProvince,
  selectedDepartments,
  onToggleDepartment,
  provinceOptions,
  departmentOptions,
}) {
  return (
    <article className="settings-card">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">📍</span>
          <h2>Headquarters</h2>
        </div>
      </div>

      <div className="settings-fields">
        <div className="settings-field">
          <span>Provincia o provincias donde puede aparecer</span>
          <MultiChoiceChips
            values={selectedProvinces}
            onToggle={onToggleProvince}
            options={provinceOptions}
          />
        </div>

        <div className="settings-field">
          <span>Departamentos donde llega su alcance de trabajo</span>
          <MultiChoiceChips
            values={selectedDepartments}
            onToggle={onToggleDepartment}
            options={departmentOptions}
          />
        </div>
      </div>
    </article>
  );
}
