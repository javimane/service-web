"use client";
import { useState } from "react";
import { Star, X, ImagePlus, Loader2, Send } from "lucide-react";
import { createReviewAction } from "../../../app/actions/reviews";
import { supabase } from "../../../services/supabaseClient";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: number;
  userId: string;
  token?: string;
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  professionalId,
  userId,
  token,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `reviews/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("uploads")
      .upload(path, file, { upsert: true });
    if (error) {
      console.error("Image upload error:", error.message);
      return null;
    }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Por favor seleccioná una calificación.");
      return;
    }
    if (!comment.trim()) {
      setError("El comentario no puede estar vacío.");
      return;
    }

    setIsSubmitting(true);
    try {
      let image_url: string | undefined;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) image_url = uploaded;
      }

      const result = await createReviewAction({
        professional_id: professionalId,
        user_id: userId,
        rating,
        comment: comment.trim(),
        image_url,
        token,
      });

      if (result?.serverError) {
        setError(result.serverError);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al enviar la opinión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setRating(0);
    setHoverRating(0);
    setComment("");
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="review-modal-overlay" onClick={handleClose}>
      <div
        className="review-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Dejar una opinión"
      >
        <button
          className="review-modal__close"
          onClick={handleClose}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {success ? (
          <div className="review-modal__success">
            <div className="review-modal__success-icon">✓</div>
            <h3>¡Gracias por tu opinión!</h3>
            <p>Tu reseña fue enviada exitosamente.</p>
          </div>
        ) : (
          <>
            <div className="review-modal__header">
              <h2>Dejar una opinión</h2>
              <p>Contale a otros cómo fue tu experiencia</p>
            </div>

            <form onSubmit={handleSubmit} className="review-modal__form">
              {/* Star Rating */}
              <div className="review-modal__rating-section">
                <label className="review-modal__label">Calificación</label>
                <div className="review-modal__stars" role="group" aria-label="Calificación con estrellas">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="review-modal__star-btn"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        size={32}
                        fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                        className={
                          (hoverRating || rating) >= star
                            ? "review-star--active"
                            : "review-star--inactive"
                        }
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <span className="review-modal__rating-label">
                    {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][rating]}
                  </span>
                )}
              </div>

              {/* Comment */}
              <div className="review-modal__field">
                <label className="review-modal__label" htmlFor="review-comment">
                  Comentario
                </label>
                <textarea
                  id="review-comment"
                  className="review-modal__textarea"
                  placeholder="Contanos tu experiencia con este profesional..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <span className="review-modal__char-count">
                  {comment.length}/500
                </span>
              </div>

              {/* Image Upload */}
              <div className="review-modal__field">
                <label className="review-modal__label">
                  Foto (opcional)
                </label>
                <label
                  htmlFor="review-image"
                  className="review-modal__image-upload"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="review-modal__image-preview"
                    />
                  ) : (
                    <div className="review-modal__image-placeholder">
                      <ImagePlus size={28} />
                      <span>Subir foto</span>
                    </div>
                  )}
                  <input
                    id="review-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    className="review-modal__remove-img"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Quitar imagen
                  </button>
                )}
              </div>

              {error && (
                <div className="review-modal__error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="review-modal__submit"
                disabled={isSubmitting}
                id="review-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar opinión
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
