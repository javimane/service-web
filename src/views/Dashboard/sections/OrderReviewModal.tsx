"use client";

import React, { useState, useEffect } from "react";
import { Star, Loader2, Sparkles } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { OrderSummary } from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import {
  createProductCommentAction,
  createServiceCommentAction,
} from "@/app/actions/comments";
import { createReviewAction } from "@/app/actions/reviews";
import "./OrderReviewModal.css";

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderSummary | null;
  onSuccess?: () => void;
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
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const defaultName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "";
      setUserName(defaultName);
    }
  }, [isOpen, user]);

  if (!order) return null;

  const isService = Boolean(order.service_id || order.service);
  const serviceId = order.service_id || order.service?.id;
  const productId =
    order.professional_product?.product?.id ||
    (order as any).items?.[0]?.product_id ||
    (order as any).professional_product_id;

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

    if (!commentText.trim()) {
      showError("Por favor, escribí tu opinión.");
      return;
    }
    if (!userName.trim()) {
      showError("Por favor, ingresá tu nombre.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isService && serviceId) {
        await createServiceCommentAction({
          service_id: serviceId,
          text: commentText.trim(),
          user_name: userName.trim(),
          rating,
          user_avatar: user?.user_metadata?.avatar_url || undefined,
          image_url: imageUrl.trim() || undefined,
        });
      } else if (productId) {
        await createProductCommentAction({
          product_id: String(productId),
          text: commentText.trim(),
          user_name: userName.trim(),
          rating,
          user_avatar: user?.user_metadata?.avatar_url || undefined,
          image_url: imageUrl.trim() || undefined,
        });
      }

      // Also record professional review if merchant exists
      if (order.professional_id && user?.id) {
        try {
          await createReviewAction({
            professional_id: Number(order.professional_id),
            user_id: user.id,
            rating,
            comment: commentText.trim(),
            image_url: imageUrl.trim() || undefined,
          });
        } catch (revErr) {
          console.warn(
            "Could not register professional general review:",
            revErr,
          );
        }
      }

      // Mark order as reviewed in localStorage
      if (typeof window !== "undefined" && order.id) {
        localStorage.setItem(`order_reviewed_${order.id}`, "true");
      }

      showSuccess("¡Reseña enviada con éxito! Gracias por tu opinión.");
      setCommentText("");
      setImageUrl("");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
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
      title="Calificar tu compra"
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
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ej: Juan Pérez"
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
              type="url"
              className="order-review-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
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
      </div>
    </Modal>
  );
}
