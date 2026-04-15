export default function ArcaVerificationSection() {
  return (
    <article className="settings-card settings-card--wide verification-card">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">🧾</span>
          <h2>ARCA Verification</h2>
        </div>
      </div>

      <div className="settings-fields">
        <span className="upload-label">
          Constancia de inscripción de AFIP en formato PDF
        </span>
        <label className="upload-box">
          <input type="file" accept="application/pdf" />
          <span className="upload-icon">📎</span>
          <strong>UPLOAD DOCUMENT</strong>
          <small>PDF, JPG o PNG hasta 5MB</small>
        </label>
      </div>
    </article>
  );
}
