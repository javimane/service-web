export default function RegistrationStatusSection({
  businessType,
  hasStorefront,
  isRegistered,
}) {
  return (
    <article className="settings-card settings-card--side">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">🪪</span>
          <h2>Registration Status</h2>
        </div>
      </div>
      <div className="settings-status-card">
        <div className="status-line">
          <span>Tipo</span>
          <strong>{businessType === "empresa" ? "Empresa" : "Autónomo"}</strong>
        </div>
        <div className="status-line">
          <span>Comercio</span>
          <strong>{hasStorefront === "si" ? "Sí" : "No"}</strong>
        </div>
        <div className="status-line">
          <span>Matrícula</span>
          <strong>
            {isRegistered === "si" ? "Verificada" : "No informada"}
          </strong>
        </div>
      </div>
    </article>
  );
}
