import { useState, useRef } from "react";
import {
  Info,
  Calendar,
  Image as ImageIcon,
  Percent,
  Sparkles,
  Eye,
  Download,
  Send,
  Upload,
  Ticket,
  X,
} from "lucide-react";
import "./PromotionCreator.css";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Porcentaje" },
  { value: "fixed", label: "Monto fijo" },
  { value: "bogo", label: "2x1" },
  { value: "free", label: "Gratis" },
];

export default function PromotionCreator({ onBack, onViewAll }) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    validFrom: "",
    validTo: "",
    unlimitedStock: false,
    discountType: "percentage",
    discountValue: 0,
    applicableTo: "",
    image: null,
    imagePreview: null,
  });

  const [promoCode] = useState(generateUUID());
  const [isDragging, setIsDragging] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      updateField("image", file);
      updateField("imagePreview", e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemoveImage = () => {
    updateField("image", null);
    updateField("imagePreview", null);
  };

  const handleCreate = () => {
    // Future: submit to backend
  };

  const discountSuffix =
    form.discountType === "percentage"
      ? "%"
      : form.discountType === "fixed"
        ? "$"
        : "";

  const offerLabel =
    form.discountType === "percentage"
      ? `-${form.discountValue}%`
      : form.discountType === "fixed"
        ? `-$${form.discountValue}`
        : form.discountType === "bogo"
          ? "2x1"
          : "GRATIS";

  return (
    <div className="promo-creator">
      {/* Header */}
      <div className="promo-creator__header">
        <div>
          <span className="promo-creator__label">CAMPAIGN MANAGER</span>
          <h1 className="promo-creator__title">Crear Nueva Promoción</h1>
        </div>
        <div className="promo-creator__status-badge">
          <span className="status-dot" />
          STATUS: DRAFT
        </div>
      </div>

      {/* Body Grid */}
      <div className="promo-creator__body">
        {/* Left Column */}
        <div className="promo-creator__left">
          {/* Basic Info */}
          <section className="promo-card">
            <h2 className="promo-card__heading">
              <Info size={18} /> Basic Info
            </h2>

            <div className="promo-field">
              <label className="promo-field__label">
                TÍTULO DE LA PROMOCIÓN
              </label>
              <input
                type="text"
                className="promo-field__input"
                placeholder="Ej. Summer Architecture Expo 2024"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            <div className="promo-field">
              <label className="promo-field__label">DESCRIPCIÓN</label>
              <textarea
                className="promo-field__textarea"
                placeholder="Describe los beneficios y alcances de esta promoción..."
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
          </section>

          {/* Visuals */}
          <section className="promo-card">
            <h2 className="promo-card__heading">
              <ImageIcon size={18} /> Visuals
            </h2>

            {form.imagePreview ? (
              <div className="promo-image-preview">
                <img src={form.imagePreview} alt="Preview" />
                <button
                  className="promo-image-preview__remove"
                  onClick={handleRemoveImage}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className={`promo-dropzone ${isDragging ? "promo-dropzone--active" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fileInputRef.current?.click();
                }}
              >
                <Upload size={32} className="promo-dropzone__icon" />
                <p className="promo-dropzone__text">
                  <strong>Arrastra la imagen de Promoción aquí</strong>
                </p>
                <span className="promo-dropzone__hint">
                  o haz clic para explorar archivos (JPG, PNG hasta 10MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageFile(e.target.files[0])}
                />
              </div>
            )}
          </section>

          {/* Discount Logic + Application */}
          <div className="promo-creator__row">
            <section className="promo-card promo-card--half">
              <h2 className="promo-card__heading">
                <Percent size={18} /> Discount Logic
              </h2>

              <div className="promo-field">
                <label className="promo-field__label">TIPO DE DESCUENTO</label>
                <select
                  className="promo-field__select"
                  value={form.discountType}
                  onChange={(e) => updateField("discountType", e.target.value)}
                >
                  {DISCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {(form.discountType === "percentage" ||
                form.discountType === "fixed") && (
                <div className="promo-field">
                  <label className="promo-field__label">VALOR</label>
                  <div className="promo-field__input-group">
                    <input
                      type="number"
                      className="promo-field__input"
                      value={form.discountValue}
                      min={0}
                      onChange={(e) =>
                        updateField("discountValue", e.target.value)
                      }
                    />
                    <span className="promo-field__suffix">
                      {discountSuffix}
                    </span>
                  </div>
                </div>
              )}
            </section>

            <section className="promo-card promo-card--half">
              <h2 className="promo-card__heading">
                <Sparkles size={18} /> Application
              </h2>

              <div className="promo-field">
                <label className="promo-field__label">APLICABLE A</label>
                <textarea
                  className="promo-field__textarea"
                  rows={3}
                  placeholder="Especifica los servicios, productos o categorías a los que aplica esta promoción..."
                  value={form.applicableTo}
                  onChange={(e) => updateField("applicableTo", e.target.value)}
                />
                <span className="promo-field__hint">
                  Ingresa los términos separados por comas o describe el alcance
                  de manera libre.
                </span>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column */}
        <div className="promo-creator__right">
          {/* Validity & Stock */}
          <section className="promo-card">
            <h2 className="promo-card__heading">
              <Calendar size={18} /> Validity &amp; Stock
            </h2>

            <div className="promo-field">
              <label className="promo-field__label">VÁLIDO DESDE</label>
              <input
                type="date"
                className="promo-field__input"
                value={form.validFrom}
                onChange={(e) => updateField("validFrom", e.target.value)}
              />
            </div>

            <div className="promo-field">
              <label className="promo-field__label">VÁLIDO HASTA</label>
              <input
                type="date"
                className="promo-field__input"
                value={form.validTo}
                onChange={(e) => updateField("validTo", e.target.value)}
              />
            </div>

            <label className="promo-checkbox">
              <input
                type="checkbox"
                checked={form.unlimitedStock}
                onChange={(e) =>
                  updateField("unlimitedStock", e.target.checked)
                }
              />
              <span>HASTA AGOTAR STOCK</span>
            </label>
          </section>

          {/* Preview Card */}
          <section className="promo-card promo-card--preview">
            <div className="promo-preview-card">
              <div className="promo-preview-card__image">
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="Promo" />
                ) : (
                  <div className="promo-preview-card__placeholder">
                    <ImageIcon size={48} />
                  </div>
                )}
                <span className="promo-preview-card__badge">PREVIEW</span>
              </div>
              <div className="promo-preview-card__content">
                <h3>{form.title || "Your Promo Title Here"}</h3>
                <p>
                  {form.description ||
                    "Short description preview showing how the text will appear in the customer hub dashboard."}
                </p>
                <div className="promo-preview-card__footer">
                  <span className="promo-preview-card__offer">
                    {offerLabel}
                  </span>
                  <span className="promo-preview-card__studio">
                    STUDIO ALPHA
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Promo Code */}
          <section className="promo-card promo-card--code">
            <div className="promo-code-display">
              <Ticket size={16} />
              <span className="promo-code-display__label">CÓDIGO:</span>
              <code className="promo-code-display__value">
                {promoCode.slice(0, 8).toUpperCase()}
              </code>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="promo-creator__footer">
        <span className="promo-creator__last-edit">
          ✦ ÚLTIMA EDICIÓN HACE 2 MINUTOS
        </span>

        <div className="promo-creator__footer-actions">
          <button
            type="button"
            className="promo-btn promo-btn--outline"
            onClick={onViewAll}
          >
            <Eye size={16} />
            VISTA PREVIA
          </button>
          <button type="button" className="promo-btn promo-btn--outline">
            <Download size={16} />
            DESCARGAR CUPÓN
          </button>
          <button
            type="button"
            className="promo-btn promo-btn--primary"
            onClick={handleCreate}
          >
            CREAR PROMOCIÓN
            <Send size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
