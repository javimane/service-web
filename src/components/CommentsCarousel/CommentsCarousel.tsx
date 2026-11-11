"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Loader2,
  Sparkles,
  X,
  ZoomIn,
} from "lucide-react";
import useCarouselDrag from "../../hooks/useCarouselDrag";
import {
  getProductCommentsAction,
  getServiceCommentsAction,
} from "../../app/actions/comments";
import Modal from "../Modal/Modal";
import "./CommentsCarousel.css";

interface CommentsCarouselProps {
  type: "product" | "service";
  targetId: string;
  title?: string;
}

interface CommentItem {
  id: string | number;
  user_name?: string;
  avatar_url?: string;
  user_avatar?: string;
  rating?: number | string;
  text?: string;
  image_url?: string;
  created_at?: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CommentsCarousel({
  type,
  targetId,
  title,
}: CommentsCarouselProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".comment-card");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpandedImageUrl(null);
      }
    };

    if (expandedImageUrl) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedImageUrl]);

  const queryKey = useMemo(
    () => ["comments", type, targetId],
    [type, targetId],
  );

  const { data: commentsResponse, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!targetId) return { items: [], total: 0 };
      if (type === "product") {
        const res = await getProductCommentsAction({
          productId: targetId,
          page: 1,
          limit: 30,
        });
        return res?.data ?? { items: [], total: 0 };
      } else {
        const res = await getServiceCommentsAction({
          serviceId: targetId,
          page: 1,
          limit: 30,
        });
        return res?.data ?? { items: [], total: 0 };
      }
    },
    enabled: Boolean(targetId),
    staleTime: 1000 * 60 * 3,
  });

  const commentsList: CommentItem[] = useMemo(() => {
    if (!commentsResponse) return [];
    if (Array.isArray(commentsResponse)) return commentsResponse;
    if (Array.isArray(commentsResponse.items)) return commentsResponse.items;
    if (Array.isArray((commentsResponse as any).data))
      return (commentsResponse as any).data;
    return [];
  }, [commentsResponse]);

  const defaultTitle =
    type === "product"
      ? "Opiniones sobre el Producto"
      : "Opiniones sobre el Servicio";

  const handlePointerDownWithDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    handlePointerDown(e);
  };

  const handlePointerMoveWithDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartPos.current) {
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      if (dx > 8 || dy > 8) {
        hasDraggedRef.current = true;
      }
    }
    handlePointerMove(e);
  };

  const handleCardClick = (comment: CommentItem) => {
    if (hasDraggedRef.current) return;
    setSelectedComment(comment);
  };

  return (
    <section className="comments-carousel">
      <div className="comments-carousel__header">
        <div className="comments-carousel__title-group">
          <span className="comments-carousel__badge">
            <MessageSquare size={13} /> Comunidad
          </span>
          <h2 className="comments-carousel__title">
            {title || defaultTitle}
            {commentsList.length > 0 && (
              <span className="comments-carousel__count">
                ({commentsList.length})
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="comments-carousel__wrap">
        {isLoading ? (
          <div className="comments-carousel__loading">
            <Loader2 className="animate-spin" size={28} />
            <span>Cargando comentarios...</span>
          </div>
        ) : commentsList.length === 0 ? (
          <div className="comments-carousel__empty">
            <Sparkles size={36} className="comments-carousel__empty-icon" />
            <h4>Aún no hay comentarios</h4>
            <p>
              Los compradores que hayan adquirido este{" "}
              {type === "product" ? "producto" : "servicio"} podrán compartir su
              experiencia aquí.
            </p>
          </div>
        ) : (
          <>
            <button
              className={`carousel-control carousel-control--left ${
                showLeftArrow ? "" : "carousel-control--hidden"
              }`}
              type="button"
              onClick={() => scrollCarousel(-1)}
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div
              ref={sliderRef}
              className="comments-carousel__scroll"
              onScroll={updateArrowVisibility}
              onPointerDown={handlePointerDownWithDrag}
              onPointerMove={handlePointerMoveWithDrag}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {commentsList.map((c) => {
                const commentRating = Number(c.rating || 5);
                const avatar = c.user_avatar || c.avatar_url;

                return (
                  <article
                    key={c.id}
                    className="comment-card comment-card--clickable"
                    onClick={() => handleCardClick(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedComment(c);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver opinión de ${c.user_name || "Cliente"}`}
                  >
                    <div className="comment-card__header">
                      <div className="comment-card__avatar">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={c.user_name || "Usuario"}
                            draggable="false"
                          />
                        ) : (
                          <span className="comment-card__initials">
                            {getInitials(c.user_name || "Usuario")}
                          </span>
                        )}
                      </div>
                      <div className="comment-card__meta">
                        <span className="comment-card__author">
                          {c.user_name || "Cliente"}
                        </span>
                        <span className="comment-card__date">
                          {formatDate(c.created_at || "")}
                        </span>
                        <div className="comment-card__rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={13}
                              className={
                                star <= commentRating
                                  ? "comment-card__star"
                                  : "comment-card__star--empty"
                              }
                              fill={star <= commentRating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="comment-card__text">{c.text}</p>

                    {c.image_url && (
                      <div className="comment-card__image-preview">
                        <img
                          src={c.image_url}
                          alt="Foto adjunta"
                          draggable="false"
                        />
                        <span className="comment-card__image-overlay">
                          <ZoomIn size={14} />
                        </span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <button
              className={`carousel-control carousel-control--right ${
                showRightArrow ? "" : "carousel-control--hidden"
              }`}
              type="button"
              onClick={() => scrollCarousel(1)}
              aria-label="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Modal con detalle del comentario */}
      <Modal
        isOpen={Boolean(selectedComment)}
        onClose={() => {
          setSelectedComment(null);
          setExpandedImageUrl(null);
        }}
        title="Opinión de la comunidad"
        maxWidth="560px"
      >
        {selectedComment && (
          <div className="comment-modal-detail">
            <div className="comment-modal-detail__header">
              <div className="comment-modal-detail__avatar">
                {selectedComment.user_avatar || selectedComment.avatar_url ? (
                  <img
                    src={selectedComment.user_avatar || selectedComment.avatar_url}
                    alt={selectedComment.user_name || "Usuario"}
                  />
                ) : (
                  <span className="comment-modal-detail__initials">
                    {getInitials(selectedComment.user_name || "Usuario")}
                  </span>
                )}
              </div>
              <div className="comment-modal-detail__meta">
                <span className="comment-modal-detail__author">
                  {selectedComment.user_name || "Cliente"}
                </span>
                <span className="comment-modal-detail__date">
                  {formatDate(selectedComment.created_at || "")}
                </span>
                <div
                  className="comment-modal-detail__rating"
                  aria-label={`Calificación: ${Number(selectedComment.rating || 5)} de 5 estrellas`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= Number(selectedComment.rating || 5)
                          ? "comment-card__star"
                          : "comment-card__star--empty"
                      }
                      fill={
                        star <= Number(selectedComment.rating || 5)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="comment-modal-detail__content">
              <p className="comment-modal-detail__text">{selectedComment.text}</p>
            </div>

            {selectedComment.image_url && (
              <div className="comment-modal-detail__media">
                <span className="comment-modal-detail__media-label">
                  Foto adjunta
                </span>
                <button
                  type="button"
                  className="comment-modal-detail__image-btn"
                  onClick={() =>
                    setExpandedImageUrl(selectedComment.image_url || null)
                  }
                  title="Hacé click para ver la imagen en tamaño grande"
                  aria-label="Ver imagen ampliada"
                >
                  <img
                    src={selectedComment.image_url}
                    alt="Foto adjunta a la opinión"
                    className="comment-modal-detail__image"
                  />
                  <span className="comment-modal-detail__zoom-tag">
                    <ZoomIn size={15} />
                    <span>Hacé click para ampliar</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Lightbox para ver la imagen en tamaño grande */}
      {expandedImageUrl && (
        <div
          className="comment-lightbox"
          onClick={() => setExpandedImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
        >
          <div
            className="comment-lightbox__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="comment-lightbox__close"
              onClick={() => setExpandedImageUrl(null)}
              aria-label="Cerrar imagen"
            >
              <X size={24} />
            </button>
            <img
              src={expandedImageUrl}
              alt="Foto adjunta en tamaño grande"
              className="comment-lightbox__img"
            />
          </div>
        </div>
      )}
    </section>
  );
}
