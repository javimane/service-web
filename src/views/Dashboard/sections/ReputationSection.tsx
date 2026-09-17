"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  commerceService,
  ProfessionalScore,
  ProfessionalReview,
} from "@/services/commerceService";
import "./ReputationSection.css";

interface TierInfo {
  name: string;
  min: number;
  max: number;
  badgeClass: string;
  label: string;
}

const TIERS: TierInfo[] = [
  {
    name: "Novato",
    min: 0,
    max: 49,
    badgeClass: "reputation-tier--novice",
    label: "Nivel Inicial",
  },
  {
    name: "Bronce",
    min: 50,
    max: 149,
    badgeClass: "reputation-tier--bronze",
    label: "Nivel Bronce",
  },
  {
    name: "Plata",
    min: 150,
    max: 299,
    badgeClass: "reputation-tier--silver",
    label: "Nivel Plata",
  },
  {
    name: "Oro",
    min: 300,
    max: 599,
    badgeClass: "reputation-tier--gold",
    label: "Nivel Oro",
  },
  {
    name: "Platino",
    min: 600,
    max: 999,
    badgeClass: "reputation-tier--platinum",
    label: "Nivel Platino",
  },
  {
    name: "Mercado Líder",
    min: 1000,
    max: 1999,
    badgeClass: "reputation-tier--leader",
    label: "Mercado Líder",
  },
  {
    name: "Supremo",
    min: 2000,
    max: Infinity,
    badgeClass: "reputation-tier--supreme",
    label: "Nivel Supremo",
  },
];

function getTierByScore(score: number): TierInfo {
  return TIERS.find((t) => score >= t.min && score <= t.max) || TIERS[0];
}

interface ReputationSectionProps {
  professionalIdProp?: string | number;
}

export default function ReputationSection({
  professionalIdProp,
}: ReputationSectionProps) {
  const { sessionStatus } = useAuth();
  const professionalId =
    professionalIdProp ||
    sessionStatus?.subscription?.professional_id ||
    sessionStatus?.professional_id;

  const [reviewFilter, setReviewFilter] = useState<
    "all" | "positive" | "negative"
  >("all");

  const { data: scoreData, isLoading: isLoadingScore } =
    useQuery<ProfessionalScore>({
      queryKey: ["professional-score", professionalId],
      queryFn: () => commerceService.getProfessionalScore(professionalId!),
      enabled: Boolean(professionalId),
      staleTime: 60 * 1000,
    });

  const { data: reviewsData = [], isLoading: isLoadingReviews } = useQuery<
    ProfessionalReview[]
  >({
    queryKey: ["professional-reviews", professionalId],
    queryFn: () => commerceService.getProfessionalReviews(professionalId!),
    enabled: Boolean(professionalId),
    staleTime: 60 * 1000,
  });

  const score = scoreData?.score ?? 0;
  const tier = getTierByScore(score);
  const nextTier =
    TIERS[TIERS.findIndex((t) => t.name === tier.name) + 1] || null;

  const progress = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((score - tier.min) / (nextTier.min - tier.min)) * 100
          )
        )
      )
    : 100;

  const reviews = Array.isArray(reviewsData) ? reviewsData : [];
  const averageRating =
    scoreData?.average_rating ??
    (reviews.length
      ? Number(
          (
            reviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
            reviews.length
          ).toFixed(1)
        )
      : 5.0);

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === "positive") return (r.rating || 5) >= 4;
    if (reviewFilter === "negative") return (r.rating || 5) <= 3;
    return true;
  });

  const completedRate = scoreData?.completed_services_rate ?? 100;
  const penaltiesCount = scoreData?.penalties_count ?? 0;

  return (
    <div className="reputation-section">
      <header className="reputation-section__header">
        <div>
          <span className="reputation-section__subtitle">
            Rendimiento y Reputación
          </span>
          <h1 className="reputation-section__title">
            Scoring del Profesional
          </h1>
        </div>
      </header>

      {/* Hero Score Card */}
      <div className="reputation-hero-card">
        <div className="reputation-hero-card__body">
          <div className="reputation-score-box">
            <div className={`reputation-medal-icon-wrap ${tier.badgeClass}`}>
              <Award size={36} />
            </div>
            <div className="reputation-score-details">
              <span className="reputation-score-details__label">
                Puntaje de Reputación
              </span>
              <div className="reputation-score-details__value-row">
                <span className="reputation-score-number">
                  {isLoadingScore ? "--" : score}
                </span>
                <span className="reputation-score-unit">pts</span>
              </div>
              <span className={`reputation-tier-badge ${tier.badgeClass}`}>
                <Sparkles size={12} /> {tier.label}
              </span>
            </div>
          </div>

          <div className="reputation-rating-summary">
            <div className="reputation-rating-stars-col">
              <div className="reputation-stars-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(averageRating) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className="reputation-stars-count">
                {reviews.length}{" "}
                {reviews.length === 1 ? "opinión" : "opiniones de clientes"}
              </span>
            </div>
            <span className="reputation-rating-big-number">
              {Number(averageRating).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Progress to Next Tier */}
        <div className="reputation-progress-wrap">
          <div className="reputation-progress-labels">
            <span>Nivel actual: {tier.name}</span>
            <span>
              {nextTier
                ? `Próximo nivel: ${nextTier.name} (${nextTier.min} pts)`
                : "¡Has alcanzado el nivel máximo!"}
            </span>
          </div>
          <div className="reputation-progress-bar-bg">
            <div
              className="reputation-progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div className="reputation-metrics-grid">
        <div className="reputation-metric-card">
          <div className="reputation-metric-card__icon reputation-metric-card__icon--green">
            <CheckCircle2 size={22} />
          </div>
          <div className="reputation-metric-card__info">
            <span className="reputation-metric-card__label">
              Servicios Completados
            </span>
            <span className="reputation-metric-card__value">
              {completedRate}%
            </span>
            <span className="reputation-metric-card__hint">
              Sin cancelaciones de tu parte
            </span>
          </div>
        </div>

        <div className="reputation-metric-card">
          <div className="reputation-metric-card__icon reputation-metric-card__icon--blue">
            <Clock size={22} />
          </div>
          <div className="reputation-metric-card__info">
            <span className="reputation-metric-card__label">
              Asignación de Turnos
            </span>
            <span className="reputation-metric-card__value">&lt; 2 hrs</span>
            <span className="reputation-metric-card__hint">
              Tiempo promedio de respuesta
            </span>
          </div>
        </div>

        <div className="reputation-metric-card">
          <div className="reputation-metric-card__icon reputation-metric-card__icon--amber">
            <ShieldCheck size={22} />
          </div>
          <div className="reputation-metric-card__info">
            <span className="reputation-metric-card__label">
              Penalizaciones Activas
            </span>
            <span className="reputation-metric-card__value">
              {penaltiesCount}
            </span>
            <span className="reputation-metric-card__hint">
              {penaltiesCount === 0
                ? "Estado óptimo, sin penalizaciones"
                : "Afecta negativamente tu puntuación"}
            </span>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reputation-reviews-card">
        <div className="reputation-reviews-header">
          <h2 className="reputation-reviews-title">
            Calificaciones y Opiniones de Compradores
          </h2>
          <div className="reputation-reviews-tabs">
            <button
              type="button"
              className={`reputation-tab-btn ${
                reviewFilter === "all" ? "reputation-tab-btn--active" : ""
              }`}
              onClick={() => setReviewFilter("all")}
            >
              Todas ({reviews.length})
            </button>
            <button
              type="button"
              className={`reputation-tab-btn ${
                reviewFilter === "positive" ? "reputation-tab-btn--active" : ""
              }`}
              onClick={() => setReviewFilter("positive")}
            >
              Positivas 4-5★
            </button>
            <button
              type="button"
              className={`reputation-tab-btn ${
                reviewFilter === "negative" ? "reputation-tab-btn--active" : ""
              }`}
              onClick={() => setReviewFilter("negative")}
            >
              A mejorar 1-3★
            </button>
          </div>
        </div>

        <div className="reputation-reviews-list">
          {isLoadingReviews ? (
            <div className="reputation-reviews-empty">
              Cargando opiniones de clientes...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="reputation-reviews-empty">
              No hay calificaciones registradas en este filtro.
            </div>
          ) : (
            filteredReviews.map((review) => {
              const customerName = review.customer_name || "Cliente verificado";
              const initial = customerName.charAt(0).toUpperCase();

              return (
                <div key={review.id} className="reputation-review-item">
                  <div className="reputation-review-item__top">
                    <div className="reputation-review-user">
                      <div className="reputation-review-avatar">{initial}</div>
                      <span className="reputation-review-name">
                        {customerName}
                      </span>
                    </div>
                    <span className="reputation-review-date">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString("es-AR")
                        : "Reciente"}
                    </span>
                  </div>

                  <div className="reputation-stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="reputation-review-comment">{review.comment}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Scoring Explanatory Guide Box */}
      <div className="reputation-guide-card">
        <div className="reputation-guide-header">
          <HelpCircle size={18} className="icon-blue" />
          <h3 className="reputation-guide-title">
            ¿Cómo funciona el sistema de reputación en Sercio?
          </h3>
        </div>

        <div className="reputation-guide-grid">
          <div className="reputation-guide-block">
            <h4 className="reputation-guide-block__title">
              <TrendingUp size={16} /> Reglas de Puntaje
            </h4>
            <ul className="reputation-rules-list">
              <li className="reputation-rule-item">
                <span className="reputation-rule-tag reputation-rule-tag--pos">
                  +10 pts
                </span>
                <span>Por cada venta o servicio completado y liquidado con éxito.</span>
              </li>
              <li className="reputation-rule-item">
                <span className="reputation-rule-tag reputation-rule-tag--pos">
                  +5 pts
                </span>
                <span>Por cada valoración de 5 estrellas otorgada por tus clientes.</span>
              </li>
              <li className="reputation-rule-item">
                <span className="reputation-rule-tag reputation-rule-tag--neg">
                  -20 pts
                </span>
                <span>
                  Por cancelación voluntaria de un pedido o turno ya confirmado.
                </span>
              </li>
            </ul>
          </div>

          <div className="reputation-guide-block">
            <h4 className="reputation-guide-block__title">
              <Award size={16} /> Beneficios de Subir de Nivel
            </h4>
            <ul className="reputation-rules-list">
              <li className="reputation-rule-item">
                <span className="reputation-rule-tag reputation-rule-tag--pos">
                  Visibilidad
                </span>
                <span>
                  Mayor exposición en las búsquedas locales del marketplace y mapa.
                </span>
              </li>
              <li className="reputation-rule-item">
                <span className="reputation-rule-tag reputation-rule-tag--pos">
                  Confianza
                </span>
                <span>
                  Insignia y medalla de distinción visible en tu perfil público.
                </span>
              </li>
              <li className="reputation-rule-item">
                <span className="reputation-rule-tag reputation-rule-tag--pos">
                  Prioridad
                </span>
                <span>
                  Prioridad en la asignación de pedidos con envíos y nuevos clientes.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
