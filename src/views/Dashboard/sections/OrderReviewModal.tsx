"use client";

import React, { useState, useEffect } from "react";
import { Star, Loader2, Sparkles } from "lucide-react";
import { uploadProductCommentImage, uploadReviewImage } from "@/services/storageUploads";
import Modal from "@/components/Modal/Modal";
import { commerceService, OrderSummary, PurchaseReview } from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { profileService } from "@/services/profileService";
import { createReviewAction } from "@/app/actions/reviews";
import "./OrderReviewModal.css";

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderSummary | null;
  onSuccess?: (review: PurchaseReview) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

export default function OrderReviewModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: OrderReviewModalProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<{ orderId: string; review: PurchaseReview } | null>(null);
  const [confirmedReview, setConfirmedReview] = useState<{ orderId: string; review: PurchaseReview | null } | null>(null);
  const [reviewLookup, setReviewLookup] = useState<"loading" | "ready" | "error">("loading");
  const [reviewLookupAttempt, setReviewLookupAttempt] = useState(0);

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    let active = true;
    setUserName("");
    profileService.getProfile(user.id).then((profile) => {
      if (active) setUserName(profile.first_name?.trim() || "");
    }).catch(() => {
      if (active) setUserName("");
    });
    return () => { active = false; };
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (!isOpen) setImageFile(null);
  }, [isOpen]);

  useEffect(() => {
    setSubmittedReview(null);
  }, [order?.id]);

  useEffect(() => {
    if (!isOpen || !order?.id) return;
    let active = true;
    setConfirmedReview(null);
    setReviewLookup("loading");
    commerceService.orderDetail(order.id).then((latestOrder) => {
      if (!active) return;
      const latestReview = Array.isArray(latestOrder.review)
        ? latestOrder.review[0] ?? null
        : latestOrder.review ?? null;
      setConfirmedReview({ orderId: order.id, review: latestReview });
      setReviewLookup("ready");
    }).catch(() => {
      if (active) setReviewLookup("error");
    });
    return () => { active = false; };
  }, [isOpen, order?.id, reviewLookupAttempt]);

  if (!order) return null;

  const isService = Boolean(order.service_id || order.service);
  const firstProductItem = order.items?.find((item) => item.product_id || item.product?.id);
  const productId =
    order.professional_product?.product?.id ||
    firstProductItem?.product_id ||
    firstProductItem?.product?.id;
  const orderReview = Array.isArray(order.review) ? order.review[0] : order.review;
  const savedReview =
    (submittedReview?.orderId === order.id ? submittedReview.review : null) ||
    (confirmedReview?.orderId === order.id ? confirmedReview.review : null) ||
    orderReview;

  const title =
    order.service?.name ||
    order.professional_product?.product?.name ||
    (order as any).items?.[0]?.product_name ||
    (isService ? "Servicio Contratado" : "Producto Comprado");

  const thumbUrl =
    order.professional_product?.product?.image_url ||
    (order as any).items?.[0]?.product_image ||
    undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savedReview || reviewLookup !== "ready") return;

    if (!commentText.trim()) {
      showError("Por favor, escribí tu opinión.");
      return;
    }
    if (!userName.trim()) {
      showError("Completá tu nombre en tu perfil para calificar la compra.");
      return;
    }
    if (imageFile && (!imageFile.type.startsWith("image/") || imageFile.size > 10 * 1024 * 1024)) {
      showError("Elegí una imagen de hasta 10 MB.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isService && !productId) {
        throw new Error("No se pudo identificar el producto de esta compra.");
      }
      const imageUrl = imageFile
        ? (isService
            ? await uploadReviewImage({ file: imageFile })
            : await uploadProductCommentImage(String(productId), imageFile)).publicUrl
        : undefined;
      const saved = await commerceService.createPurchaseReview(order.id, {
        rating,
        text: commentText.trim(),
        image_url: imageUrl,
      });

      // Also record professional review if merchant exists
      if (order.professional_id && user?.id) {
        try {
          await createReviewAction({
            professional_id: Number(order.professional_id),
            user_id: user.id,
            rating,
            comment: commentText.trim(),
            image_url: imageUrl,
          });
        } catch (revErr) {
          console.warn(
            "Could not register professional general review:",
            revErr,
          );
        }
      }

      showSuccess("¡Reseña enviada con éxito! Gracias por tu opinión.");
      setCommentText("");
      setImageFile(null);
      setSubmittedReview({ orderId: order.id, review: saved });
      onSuccess?.(saved);
    } catch (err: any) {
      showError(err?.message || "No se pudo registrar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={savedReview ? "Tu calificación" : "Calificar tu compra"}
      maxWidth="520px"
    >
      <div className="order-review-modal">
        <div className="order-review-item-summary">
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt={title}
              className="order-review-item-thumb"
            />
          )}
          <div className="order-review-item-info">
            <span className="order-review-item-type">
              {isService ? "Servicio" : "Producto"}
            </span>
            <h4 className="order-review-item-title">{title}</h4>
            <span className="order-review-item-order">
              Orden #{order.order_number || order.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {savedReview ? (
          <div className="order-review-saved">
            <div className="order-review-saved__stars" aria-label={`${savedReview.rating} de 5 estrellas`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} size={20} fill={index < savedReview.rating ? "currentColor" : "none"} />
              ))}
            </div>
            <strong>{savedReview.user_name}</strong>
            <p>{savedReview.text}</p>
            {savedReview.image_url && <img className="order-review-saved__image" src={savedReview.image_url} alt="Foto de tu reseña" />}
            <small>{new Date(savedReview.created_at).toLocaleDateString("es-AR")}</small>
            <button type="button" className="order-review-cancel-btn" onClick={onClose}>Cerrar</button>
          </div>
        ) : reviewLookup === "loading" ? (
          <p role="status">Comprobando si ya calificaste esta compra...</p>
        ) : reviewLookup === "error" ? (
          <div role="alert">
            <p>No se pudo comprobar si esta compra ya tiene una calificación.</p>
            <button type="button" className="order-review-cancel-btn" onClick={() => setReviewLookupAttempt((attempt) => attempt + 1)}>
              Reintentar
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="order-review-form">
          <div className="order-review-field">
            <label>Tu calificación general</label>
            <div className="order-review-rating-box">
              <div className="order-review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`order-review-star-btn ${
                      star <= currentRating
                        ? "order-review-star-btn--filled"
                        : ""
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} estrellas`}
                  >
                    <Star
                      size={26}
                      fill={star <= currentRating ? "#f59e0b" : "none"}
                    />
                  </button>
                ))}
              </div>
              <span className="order-review-rating-label">
                {RATING_LABELS[currentRating]}
              </span>
            </div>
          </div>

          <div className="order-review-field">
            <label htmlFor="order-review-author">Tu nombre</label>
            <input
              id="order-review-author"
              type="text"
              className="order-review-input"
              value={userName}
              placeholder="Nombre de tu perfil"
              readOnly
              required
            />
          </div>

          <div className="order-review-field">
            <label htmlFor="order-review-text">
              Tu opinión sobre la compra
            </label>
            <textarea
              id="order-review-text"
              className="order-review-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="¿Cómo fue tu experiencia? Contanos sobre la calidad, atención del comercio, puntualidad o detalles que sirvan a otros usuarios."
              rows={4}
              required
            />
          </div>

          <div className="order-review-field">
            <label htmlFor="order-review-image">Foto o imagen (opcional)</label>
            <input
              id="order-review-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="order-review-input"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {imageFile && <span className="order-review-image-name">{imageFile.name}</span>}
          </div>

          <div className="order-review-actions">
            <button data-action-tone="cancel"
              type="button"
              className="order-review-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="order-review-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Publicar reseña</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </Modal>
  );
}
