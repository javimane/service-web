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
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toJpeg } from "html-to-image";
import "./PromotionCreator.css";

function generateCouponCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PROMO-${code}`;
}

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Porcentaje" },
  { value: "fixed", label: "Monto fijo" },
  { value: "bogo", label: "2x1" },
  { value: "free", label: "Gratis" },
];

export default function PromotionCreator({ onBack, onViewAll }) {
  const fileInputRef = useRef(null);
  const couponRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    professionalName: "",
    validFrom: "",
    validTo: "",
    unlimitedStock: false,
    discountType: "percentage",
    discountValue: 0,
    applicableTo: "",
    image: null,
    imagePreview: null,
  });

  const [promoCode] = useState(generateCouponCode());
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const validateForm = () => {
    const newErrors: any = {};
    if (!form.title.trim()) newErrors.title = "El título es obligatorio";
    if (!form.description.trim()) newErrors.description = "La descripción es obligatoria";
    if (!form.professionalName.trim()) newErrors.professionalName = "El nombre del profesional es obligatorio";
    if (!form.validFrom) newErrors.validFrom = "La fecha de inicio es obligatoria";
    if (!form.validTo) newErrors.validTo = "La fecha de fin es obligatoria";
    if (form.validFrom && form.validTo && form.validFrom > form.validTo) {
      newErrors.validTo = "La fecha de fin debe ser posterior a la de inicio";
    }
    if (!form.discountValue || form.discountValue <= 0) {
      newErrors.discountValue = "El valor debe ser mayor a 0";
    }
    if (!form.image) newErrors.image = "Debes subir una imagen para la promoción";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownloadCoupon = async () => {
    if (!couponRef.current) return;

    try {
      const dataUrl = await toJpeg(couponRef.current, { 
        quality: 0.95,
        backgroundColor: '#fff',
        pixelRatio: 2 // Higher quality
      });
      const link = document.createElement("a");
      link.download = `cupón-${form.title || "promo"}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error al generar imagen:", err);
      alert("No se pudo generar el archivo del cupón.");
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("professionalName", form.professionalName);
      formData.append("validFrom", form.validFrom);
      formData.append("validTo", form.validTo);
      formData.append("unlimitedStock", String(form.unlimitedStock));
      formData.append("discountType", form.discountType);
      formData.append("discountValue", String(form.discountValue));
      formData.append("applicableTo", form.applicableTo);
      formData.append("code", promoCode);
      if (form.image) {
        formData.append("image", form.image);
      }

      const response = await fetch("/api/promotions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error al guardar la promoción");

      setSuccess(true);
      setTimeout(() => onViewAll(), 1500);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
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

            <div className={`promo-field ${errors.title ? "promo-field--error" : ""}`}>
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
              {errors.title && <span className="promo-field__error">{errors.title}</span>}
            </div>

            <div className={`promo-field ${errors.professionalName ? "promo-field--error" : ""}`}>
              <label className="promo-field__label">NOMBRE DEL PROFESIONAL</label>
              <input
                type="text"
                className="promo-field__input"
                placeholder="Ej. Carlos Plomería"
                value={form.professionalName}
                onChange={(e) => updateField("professionalName", e.target.value)}
              />
              {errors.professionalName && <span className="promo-field__error">{errors.professionalName}</span>}
            </div>

            <div className={`promo-field ${errors.description ? "promo-field--error" : ""}`}>
              <label className="promo-field__label">DESCRIPCIÓN</label>
              <textarea
                className="promo-field__textarea"
                placeholder="Describe los beneficios y alcances de esta promoción..."
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
              {errors.description && <span className="promo-field__error">{errors.description}</span>}
            </div>
          </section>

          {/* Visuals */}
          <section className={`promo-card ${errors.image ? "promo-card--error" : ""}`}>
            <h2 className="promo-card__heading">
              <ImageIcon size={18} /> Visuals
            </h2>
            {errors.image && <span className="promo-field__error" style={{ marginBottom: "10px", display: "block" }}>{errors.image}</span>}


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
                <div className={`promo-field ${errors.discountValue ? "promo-field--error" : ""}`}>
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
                  {errors.discountValue && <span className="promo-field__error">{errors.discountValue}</span>}
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

            <div className="promo-creator__row">
              <div className={`promo-field ${errors.validFrom ? "promo-field--error" : ""}`}>
                <label className="promo-field__label">VÁLIDO DESDE</label>
                <input
                  type="date"
                  className="promo-field__input"
                  value={form.validFrom}
                  onChange={(e) => updateField("validFrom", e.target.value)}
                />
                {errors.validFrom && <span className="promo-field__error">{errors.validFrom}</span>}
              </div>

              <div className={`promo-field ${errors.validTo ? "promo-field--error" : ""}`}>
                <label className="promo-field__label">VÁLIDO HASTA</label>
                <input
                  type="date"
                  className="promo-field__input"
                  value={form.validTo}
                  onChange={(e) => updateField("validTo", e.target.value)}
                />
                {errors.validTo && <span className="promo-field__error">{errors.validTo}</span>}
              </div>
            </div>

            <div className="promo-switch-container">
              <label className="promo-switch">
                <input
                  type="checkbox"
                  checked={form.unlimitedStock}
                  onChange={(e) =>
                    updateField("unlimitedStock", e.target.checked)
                  }
                />
                <span className="promo-switch__slider" />
              </label>
              <span className="promo-switch__label">HASTA AGOTAR STOCK</span>
            </div>
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
            className="promo-btn promo-btn--preview"
            onClick={() => setIsPreviewOpen(true)}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "GUARDANDO..." : "CREAR PROMOCIÓN"}
            {success ? <CheckCircle2 size={16} /> : <Send size={16} />}
          </button>
        </div>
      </footer>

      {/* Coupon Preview Modal */}
      {isPreviewOpen && (
        <div className="coupon-modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="coupon-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="coupon-modal__close" onClick={() => setIsPreviewOpen(false)}>
              <X size={24} />
            </button>
            <div className="coupon-card-container">
              <div className="coupon-card" ref={couponRef}>
                <div className="coupon-card__header">
                  <Ticket size={28} className="coupon-ticket-icon" />
                  <div className="coupon-card__discount">
                    {offerLabel} OFF
                  </div>
                </div>
                <div className="coupon-card__image">
                  {form.imagePreview ? (
                    <img src={form.imagePreview} alt="Promo" />
                  ) : (
                    <div className="coupon-card__placeholder">
                      <ImageIcon size={64} />
                    </div>
                  )}
                </div>
                <div className="coupon-card__body">
                  <h2 className="coupon-card__title">
                    {form.title || "Gran Inauguración"}
                  </h2>
                  <p className="coupon-card__description">
                    {form.description || "Descuento especial en todos los servicios de plomería."}
                  </p>
                  
                  <div className="coupon-card__info-box">
                    <div className="coupon-card__info-item">
                      <Eye size={16} />
                      <span><strong>Profesional:</strong> {form.professionalName || "Carlos Plomería"}</span>
                    </div>
                    <div className="coupon-card__info-item">
                      <Calendar size={16} />
                      <span><strong>Validez:</strong> {form.validFrom || "2026-04-15"} al {form.validTo || "2026-05-15"}</span>
                    </div>
                  </div>

                  <div className="coupon-card__verify-box">
                    <span className="verify-label">CÓDIGO DE VERIFICACIÓN</span>
                    <span className="verify-code">{promoCode}</span>
                  </div>

                  <button 
                    className={`coupon-card__download-btn ${success ? 'coupon-card__download-btn--success' : 'coupon-card__download-btn--locked'}`} 
                    onClick={success ? handleDownloadCoupon : undefined}
                    title={!success ? "Debes crear la promoción para descargar el cupón" : ""}
                  >
                    {success ? (
                      <>
                        <Download size={18} />
                        Descargar Cupón (JPG)
                      </>
                    ) : (
                      <>
                        <AlertCircle size={18} />
                        Crea la promo para descargar
                      </>
                    )}
                  </button>

                  <div className="coupon-card__footer">
                    <CheckCircle2 size={14} />
                    <span>Presenta este cupón al momento del servicio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
