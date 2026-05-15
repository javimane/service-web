"use client";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "../../../context/AuthContext";
import { uploadPromotionImage } from "../../../services/storageUploads";
import {
  createProfessionalPromotionAction,
  updateProfessionalPromotionAction,
} from "../../../app/actions/professionalPromotions";
import "./PromotionCreator.css";

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Porcentaje" },
  { value: "fixed", label: "Monto fijo" },
  { value: "bogo", label: "2x1" },
  { value: "free", label: "Gratis" },
];

type EditablePromotion = {
  id?: number;
  title?: string | null;
  description?: string | null;
  from_date?: string | null;
  expires_at?: string | null;
  unlimited_stock?: boolean | null;
  discount_type?: string | null;
  discount_value?: number | null;
  applicable_to?: string | null;
  image_url?: string | null;
  state?: string | null;
};

type PromotionCreatorProps = {
  onBack: () => void;
  onViewAll: () => void;
  promotionToEdit?: EditablePromotion | null;
};

export default function PromotionCreator({
  onBack,
  onViewAll,
  promotionToEdit = null,
}: PromotionCreatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const couponRef = useRef<HTMLDivElement>(null);
  const { sessionStatus, user } = useAuth();
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [form, setForm] = useState({
    title: promotionToEdit?.title || "",
    description: promotionToEdit?.description || "",
    validFrom: promotionToEdit?.from_date
      ? promotionToEdit.from_date.split("T")[0]
      : "",
    validTo: promotionToEdit?.expires_at
      ? promotionToEdit.expires_at.split("T")[0]
      : "",
    unlimitedStock: promotionToEdit?.unlimited_stock ?? false,
    discountType: promotionToEdit?.discount_type || "percentage",
    discountValue: promotionToEdit?.discount_value || 0,
    applicableTo: promotionToEdit?.applicable_to || "",
    image: null,
    imagePreview: promotionToEdit?.image_url || null,
  });

  // Sync form when promotionToEdit changes
  useEffect(() => {
    if (promotionToEdit) {
      setForm({
        title: promotionToEdit.title || "",
        description: promotionToEdit.description || "",
        validFrom: promotionToEdit.from_date
          ? promotionToEdit.from_date.split("T")[0]
          : "",
        validTo: promotionToEdit.expires_at
          ? promotionToEdit.expires_at.split("T")[0]
          : "",
        unlimitedStock: promotionToEdit.unlimited_stock ?? false,
        discountType: promotionToEdit.discount_type || "percentage",
        discountValue: promotionToEdit.discount_value || 0,
        applicableTo: promotionToEdit.applicable_to || "",
        image: null,
        imagePreview: promotionToEdit.image_url || null,
      });
      setSuccess(false);
      setErrors({});
    } else {
      // Reset to default for new creation
      setForm({
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
      setSuccess(false);
      setErrors({});
    }
  }, [promotionToEdit]);

  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [success, setSuccess] = useState(false);

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (promotionToEdit?.id) {
        const result = await updateProfessionalPromotionAction({
          id: promotionToEdit.id,
          data,
        });
        if (result?.serverError) throw new Error(result.serverError);
        return result?.data;
      }
      const result = await createProfessionalPromotionAction(data);
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-promotions"] });
      setSuccess(true);
      setTimeout(() => onViewAll(), 1500);
    },
    onError: (err: any) => {
      alert("Error: " + err.message);
    },
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateField("image", file);
      updateField("imagePreview", reader.result);
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
    if (!form.description.trim())
      newErrors.description = "La descripción es obligatoria";
    if (!form.validFrom)
      newErrors.validFrom = "La fecha de inicio es obligatoria";
    if (!form.validTo) newErrors.validTo = "La fecha de fin es obligatoria";
    if (form.validFrom && form.validTo && form.validFrom > form.validTo) {
      newErrors.validTo = "La fecha de fin debe ser posterior a la de inicio";
    }
    if (!form.discountValue || form.discountValue <= 0) {
      newErrors.discountValue = "El valor debe ser mayor a 0";
    }
    if (!form.imagePreview)
      newErrors.image = "Debes subir una imagen para la promoción";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownloadCoupon = async () => {
    if (!couponRef.current) return;

    try {
      const dataUrl = await toJpeg(couponRef.current, {
        quality: 0.95,
        backgroundColor: "#fff",
        pixelRatio: 2, // Higher quality
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

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!professionalId) {
      alert(
        "No se encontró el ID del profesional. Por favor, reintenta iniciar sesión.",
      );
      return;
    }

    setSuccess(false);

    try {
      let imageUrl = form.imagePreview;
      if (form.image) {
        const uploaded = await uploadPromotionImage({
          file: form.image,
        });
        imageUrl = uploaded.publicUrl;
      }

      saveMutation.mutate({
        professional_id: Number(professionalId),
        title: form.title,
        description: form.description,
        from_date: form.validFrom || null,
        expires_at: form.validTo || null,
        unlimited_stock: form.unlimitedStock,
        discount_type: form.discountType,
        discount_value: Number(form.discountValue),
        applicable_to: form.applicableTo || null,
        image_url: imageUrl,
        state: promotionToEdit?.state || "active",
        updated_at: new Date().toISOString(),
        ...(promotionToEdit ? {} : { created_at: new Date().toISOString() }),
      });
    } catch (err: any) {
      alert("Error: " + err.message);
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
          <h1 className="promo-creator__title">
            {promotionToEdit ? "Editar Promoción" : "Crear Nueva Promoción"}
          </h1>
        </div>
        <div className="promo-creator__status-badge">
          <span className="status-dot" />
          STATUS: {promotionToEdit?.state?.toUpperCase() || "DRAFT"}
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

            <div
              className={`promo-field ${errors.title ? "promo-field--error" : ""}`}
            >
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
              {errors.title && (
                <span className="promo-field__error">{errors.title}</span>
              )}
            </div>

            <div
              className={`promo-field ${errors.description ? "promo-field--error" : ""}`}
            >
              <label className="promo-field__label">DESCRIPCIÓN</label>
              <textarea
                className="promo-field__textarea"
                placeholder="Describe los beneficios y alcances de esta promoción..."
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
              {errors.description && (
                <span className="promo-field__error">{errors.description}</span>
              )}
            </div>
          </section>

          {/* Visuals */}
          <section
            className={`promo-card ${errors.image ? "promo-card--error" : ""}`}
          >
            <h2 className="promo-card__heading">
              <ImageIcon size={18} /> Visuals
            </h2>
            {errors.image && (
              <span
                className="promo-field__error"
                style={{ marginBottom: "10px", display: "block" }}
              >
                {errors.image}
              </span>
            )}

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
                  onChange={(e) => handleImageFile(e.target.files?.[0])}
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
                <div
                  className={`promo-field ${errors.discountValue ? "promo-field--error" : ""}`}
                >
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
                  {errors.discountValue && (
                    <span className="promo-field__error">
                      {errors.discountValue}
                    </span>
                  )}
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
              <div
                className={`promo-field ${errors.validFrom ? "promo-field--error" : ""}`}
              >
                <label className="promo-field__label">VÁLIDO DESDE</label>
                <input
                  type="date"
                  className="promo-field__input"
                  value={form.validFrom}
                  onChange={(e) => updateField("validFrom", e.target.value)}
                />
                {errors.validFrom && (
                  <span className="promo-field__error">{errors.validFrom}</span>
                )}
              </div>

              <div
                className={`promo-field ${errors.validTo ? "promo-field--error" : ""}`}
              >
                <label className="promo-field__label">VÁLIDO HASTA</label>
                <input
                  type="date"
                  className="promo-field__input"
                  value={form.validTo}
                  onChange={(e) => updateField("validTo", e.target.value)}
                />
                {errors.validTo && (
                  <span className="promo-field__error">{errors.validTo}</span>
                )}
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
            <X size={16} />
            CANCELAR
          </button>
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
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? "GUARDANDO..."
              : promotionToEdit
                ? "GUARDAR CAMBIOS"
                : "CREAR PROMOCIÓN"}
            {success ? <CheckCircle2 size={16} /> : <Send size={16} />}
          </button>
        </div>
      </footer>

      {/* Coupon Preview Modal */}
      {isPreviewOpen && (
        <div
          className="coupon-modal-overlay"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="coupon-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="coupon-modal__close"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X size={24} />
            </button>
            <div className="public-promo-preview" ref={couponRef}>
              <div className="public-promo-preview__hero">
                {form.imagePreview ? (
                  <img
                    src={form.imagePreview}
                    alt="Promo"
                    className="public-promo-preview__image"
                  />
                ) : (
                  <div className="public-promo-preview__placeholder">
                    <ImageIcon size={64} />
                  </div>
                )}
                <div className="public-promo-preview__badge">{offerLabel}</div>
              </div>

              <div className="public-promo-preview__content">
                <div className="public-promo-preview__header">
                  <div className="public-promo-preview__professional">
                    <div className="professional-avatar-mini">
                      <Sparkles size={16} />
                    </div>
                    <div className="professional-info">
                      <span className="professional-name">
                        {user?.display_name || "Tu Studio"}
                      </span>
                      <span className="professional-label">
                        PROFESIONAL VERIFICADO
                      </span>
                    </div>
                  </div>
                  <h2 className="public-promo-preview__title">
                    {form.title || "Título de la Promoción"}
                  </h2>
                  {promotionToEdit?.id && (
                    <code className="public-promo-preview__code">
                      PROMO-
                      {String(promotionToEdit.id).slice(0, 8).toUpperCase()}
                    </code>
                  )}
                </div>

                <p className="public-promo-preview__description">
                  {form.description ||
                    "Aquí aparecerá la descripción de tu promoción para los clientes."}
                </p>

                <div className="public-promo-preview__details-grid">
                  <div className="detail-item">
                    <Calendar size={18} />
                    <div className="detail-text">
                      <label>VALIDEZ</label>
                      <span>
                        {form.validFrom || "Fecha Inicio"} -{" "}
                        {form.validTo || "Fecha Fin"}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <Sparkles size={18} />
                    <div className="detail-text">
                      <label>APLICA A</label>
                      <span>{form.applicableTo || "Todo el catálogo"}</span>
                    </div>
                  </div>
                </div>

                <div className="public-promo-preview__footer">
                  <button
                    className={`public-promo-preview__cta ${!success ? "public-promo-preview__cta--disabled" : ""}`}
                    onClick={success ? handleDownloadCoupon : undefined}
                  >
                    <Ticket size={20} />
                    {success
                      ? "OBTENER ESTE CUPÓN"
                      : "CREA LA PROMO PARA DESCARGAR"}
                  </button>
                  <p className="public-promo-preview__hint">
                    Vista previa de cómo verán los clientes tu promoción.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
