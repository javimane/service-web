import { Save, X } from "lucide-react";

export default function ActionsSection({ onSave, onCancel }) {
  return (
    <section className="settings-actions-row">
      <div className="settings-card settings-actions-card">
        <div className="settings-actions-copy">
          <h3>
            <span className="section-emoji section-emoji--small">✨</span>
            Acciones
          </h3>
          <p>Guardá o descartá los cambios del perfil comercial.</p>
        </div>
        <div className="settings-actions-buttons">
          {onCancel && (
            <button type="button" className="settings-cancel-btn" onClick={onCancel}>
              <X size={18} />
              Cancelar
            </button>
          )}
          <button type="button" className="settings-save-btn" onClick={onSave}>
            <Save size={18} />
            Guardar cambios
          </button>
        </div>
      </div>
    </section>
  );
}
