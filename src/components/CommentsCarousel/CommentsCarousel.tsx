"use client";

import { useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Loader2,
  Sparkles,
} from "lucide-react";
import useCarouselDrag from "../../hooks/useCarouselDrag";
import {
  getProductCommentsAction,
  getServiceCommentsAction,
} from "../../app/actions/comments";
import "./CommentsCarousel.css";

interface CommentsCarouselProps {
  type: "product" | "service";
  targetId: string;
  title?: string;
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

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".comment-card");

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

  const commentsList = useMemo(() => {
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
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {commentsList.map((c: any) => {
                const commentRating = Number(c.rating || 5);
                const avatar = c.user_avatar || c.avatar_url;

                return (
                  <article key={c.id} className="comment-card">
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
                          {formatDate(c.created_at)}
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
                              fill={star <= commentRating ? "#f59e0b" : "none"}
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
    </section>
  );
}
