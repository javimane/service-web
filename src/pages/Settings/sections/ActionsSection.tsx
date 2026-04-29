import { Save } from "lucide-react";

export default function ActionsSection({ onSave }) {
  return (
    <section className="settings-actions-row">
      <div className="settings-card settings-actions-card">
        <div className="settings-actions-copy">
          <h3>
            <span className="section-emoji section-emoji--small">✨</span>
            Acciones
          </h3>
          <p>Guardá los cambios del perfil comercial.</p>
        </div>
        <button type="button" className="settings-save-btn" onClick={onSave}>
          <Save size={18} />
          Guardar cambios
        </button>
      </div>
    </section>
  );
}
