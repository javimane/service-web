"use client";
import { useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Zap,
  CalendarClock,
  CreditCard,
  Check,
  AlertTriangle,
  ArrowRightLeft,
  XCircle,
  Star,
  ChevronUp,
  Loader2,
  X,
} from "lucide-react";
import {
  plans as staticPlans,
  mergePlansWithSubscriptionPrices,
} from "../../../data/plans";
import { type Subscription } from "../../../data/subscription";
import { useAuth } from "../../../context/AuthContext";
import "./SubscriptionSection.css";
import { getSubscriptionPricesAction } from "@/app/actions/plans";
import {
  getProfessionalSubscriptionAction,
  createProfessionalMeAction,
  cancelFreeSubscriptionAction,
} from "@/app/actions/professionals";
import {
  getMercadoPagoPlansAction,
  createMercadoPagoSubscriptionAction,
  cancelMercadoPagoSubscriptionAction,
} from "@/app/actions/mercadopago";
import { getAccessToken } from "@/utils/auth";

// Mapeo de los nombres de plan del API a los IDs internos
const planNameToId: Record<string, string> = {
  free: "gratuito",
  standard: "profesional-basico",
  premium: "profesional-premium",
};

function formatPrice(n: number | undefined | null) {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("es-AR");
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type DisplaySubscriptionStatus = "active" | "cancelled" | "past_due" | "none";

function normalizeSubscriptionStatus(
  status?: string | null,
): DisplaySubscriptionStatus {
  if (!status) return "none";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "past_due") return "past_due";
  return "active";
}

const statusLabels: Record<DisplaySubscriptionStatus, string> = {
  active: "Activa",
  cancelled: "Cancelada",
  past_due: "Pago pendiente",
  none: "Sin suscripción",
};

const statusIcons: Record<DisplaySubscriptionStatus, typeof Check> = {
  active: Check,
  cancelled: XCircle,
  past_due: AlertTriangle,
  none: AlertTriangle,
};

export default function SubscriptionSection() {
  const { sessionStatus, refreshSession } = useAuth();
  const [showPlans, setShowPlans] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [localSubscription, setLocalSubscription] = useState<any>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((current) => (current?.text === text ? null : current));
    }, 6000);
  };

  const { data: apiSubscription, isLoading: loadingSub } = useQuery({
    queryKey: ["professional-subscription"],
    queryFn: async () => {
      const token = await getAccessToken();
      const result = await getProfessionalSubscriptionAction({ token });
      return result?.data || result || null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const subscription = apiSubscription;

  const { data: availablePlans = staticPlans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const result = await getSubscriptionPricesAction();
      const apiPrices = Array.isArray(result?.data) ? result.data : [];
      if (apiPrices.length > 0) {
        return mergePlansWithSubscriptionPrices(staticPlans, apiPrices);
      }
      return staticPlans;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const { data: mpPlans } = useQuery({
    queryKey: ["mercadopago-plans"],
    queryFn: async () => {
      const res = await getMercadoPagoPlansAction();
      return res?.data || {};
    },
    staleTime: 1000 * 60 * 60,
  });

  const currentStatus = useMemo(
    () => normalizeSubscriptionStatus(subscription?.status),
    [subscription?.status],
  );

  const hasSubscription = useMemo(() => Boolean(subscription), [subscription]);

  const isActiveProPlan = useMemo(
    () => Boolean(sessionStatus) && currentStatus === "active",
    [sessionStatus, currentStatus],
  );

  // Plan activo según el API (null si no hay suscripción)
  const activePlanId = useMemo(
    () =>
      subscription?.plan ? (planNameToId[subscription.plan] ?? null) : null,
    [subscription?.plan],
  );

  // Fechas desde el API cuando estén disponibles
  const displayStartDate = useMemo(
    () => subscription?.started_at || subscription?.startDate || "",
    [subscription],
  );

  const displayNextPaymentDate = useMemo(
    () => subscription?.expires_at || subscription?.nextPaymentDate || "",
    [subscription],
  );

  const currentPlan = useMemo(() => {
    if (!hasSubscription) return null;

    const planId =
      activePlanId ||
      (subscription?.plan ? planNameToId[subscription.plan] : null);
    if (!planId) return null;

    return availablePlans.find((p) => p.id === planId) || null;
  }, [hasSubscription, activePlanId, subscription?.plan, availablePlans]);

  const displayAmount = useMemo(
    () =>
      subscription?.amount_paid ||
      subscription?.amount ||
      currentPlan?.price ||
      0,
    [subscription, currentPlan],
  );

  const handleCancelSubscription = async () => {
    setIsSubmitting(true);
    try {
      const isFreePlan =
        subscription?.plan === "free" || subscription?.plan === "gratuito";

      if (isFreePlan) {
        const token = await getAccessToken();
        const profId = subscription?.professional_id;
        if (!profId) throw new Error("No se pudo identificar al profesional");
        await cancelFreeSubscriptionAction({ id: profId, token });
      } else {
        await cancelMercadoPagoSubscriptionAction();
      }

      await refreshSession();
      setLocalSubscription((prev: any) => {
        const current = prev || apiSubscription;
        return current ? { ...current, status: "cancelled" } : current;
      });
      setShowCancelConfirm(false);

      // 👇 Refresca la pantalla independientemente del plan
      window.location.reload();
    } catch (error) {
      console.error("Error al cancelar suscripción:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setIsSubmitting(true);
    try {
      if (planId === "free" || planId === "gratuito") {
        const token = await getAccessToken();
        await createProfessionalMeAction({ token });
        await refreshSession();
        showFeedback(
          "success",
          "Plan gratuito activado correctamente. ¡Bienvenido!",
        );
        window.location.reload();
      } else {
        const isPremium = planId === "profesional-premium";
        const mpPlanId =
          mpPlans?.[isPremium ? "PROFESIONAL-PREMIUM" : "PROFESIONAL-BASICO"];

        if (!mpPlanId) {
          console.error(
            `ID de Mercado Pago no encontrado para el plan: ${planId}`,
          );
          return;
        }

        const response = await createMercadoPagoSubscriptionAction({
          email: sessionStatus?.email || "",
          planId: mpPlanId,
        });

        if (response?.data?.link) {
          window.open(response.data.link, "_blank");
        } else {
          console.error("No se recibió link de pago", response);
        }
      }
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusIcon = statusIcons[currentStatus];

  return (
    <div className="subscription-section">
      <div className="subscription-section__header">
        <div>
          <h1 className="subscription-section__title">Mi Suscripción</h1>
          <p className="subscription-section__subtitle">
            Gestioná tu plan y método de pago.
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`subscription-feedback subscription-feedback--${feedback.type}`}
        >
          <div className="subscription-feedback__icon">
            {feedback.type === "success" ? (
              <Check size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
          </div>
          <span>{feedback.text}</span>
          <button
            type="button"
            className="subscription-feedback__close"
            onClick={() => setFeedback(null)}
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Current plan card */}
      <div className="subscription-card">
        {hasSubscription && currentPlan ? (
          <>
            <div className="subscription-card__top">
              <div className="subscription-card__plan-info">
                <div
                  className={`subscription-card__icon ${currentPlan.recommended ? "subscription-card__icon--premium" : ""}`}
                >
                  {currentPlan.recommended ? (
                    <Zap size={24} />
                  ) : (
                    <Crown size={24} />
                  )}
                </div>
                <div>
                  <h2 className="subscription-card__plan-name">
                    {currentPlan.name}
                  </h2>
                  <p className="subscription-card__plan-desc">
                    {currentPlan.description}
                  </p>
                </div>
              </div>

              <div
                className={`subscription-card__status subscription-card__status--${currentStatus}`}
              >
                <StatusIcon size={14} />
                <span>{statusLabels[currentStatus]}</span>
              </div>
            </div>

            {/* Details grid */}
            <div className="subscription-card__details">
              <div className="subscription-detail">
                <div className="subscription-detail__icon">
                  <CreditCard size={18} />
                </div>
                <div className="subscription-detail__info">
                  <span className="subscription-detail__label">
                    Precio mensual
                  </span>
                  <span className="subscription-detail__value">
                    ${formatPrice(displayAmount)}/{currentPlan.period}
                  </span>
                </div>
              </div>

              <div className="subscription-detail">
                <div className="subscription-detail__icon">
                  <CalendarClock size={18} />
                </div>
                <div className="subscription-detail__info">
                  <span className="subscription-detail__label">
                    Próximo pago
                  </span>
                  <span className="subscription-detail__value">
                    {currentStatus === "cancelled" || !subscription
                      ? "—"
                      : formatDate(displayNextPaymentDate)}
                  </span>
                </div>
              </div>

              <div className="subscription-detail">
                <div className="subscription-detail__icon">
                  <CalendarClock size={18} />
                </div>
                <div className="subscription-detail__info">
                  <span className="subscription-detail__label">
                    Suscripto desde
                  </span>
                  <span className="subscription-detail__value">
                    {subscription ? formatDate(displayStartDate) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="subscription-card__features">
              <h3 className="subscription-card__features-title">
                Tu plan incluye
              </h3>
              <ul className="subscription-card__features-list">
                {currentPlan.features.map((feat, i) => (
                  <li
                    key={i}
                    className={
                      feat.highlighted ? "subscription-feature--highlight" : ""
                    }
                  >
                    <Check size={16} />
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="subscription-card__top">
            <div className="subscription-card__plan-info">
              <div className="subscription-card__icon">
                <Crown size={24} />
              </div>
              <div>
                <h2 className="subscription-card__plan-name">
                  Sin suscripción activa
                </h2>
                <p className="subscription-card__plan-desc">
                  Suscribite para activar tu perfil profesional y acceder a
                  todos los beneficios.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="subscription-card__actions">
          <button
            type="button"
            className="subscription-btn subscription-btn--change"
            onClick={() => {
              setShowPlans((v) => !v);
              if (!showPlans) {
                setTimeout(() => {
                  plansRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 50);
              }
            }}
          >
            <ArrowRightLeft size={18} />
            <span>
              {showPlans
                ? "Ocultar planes"
                : isActiveProPlan
                  ? "Cambiar de plan"
                  : "Suscribirse"}
            </span>
            {showPlans && <ChevronUp size={16} />}
          </button>

          {hasSubscription && isActiveProPlan && (
            <button
              type="button"
              className="subscription-btn subscription-btn--cancel"
              onClick={() => setShowCancelConfirm(true)}
            >
              <XCircle size={18} />
              <span>Cancelar suscripción</span>
            </button>
          )}

          {hasSubscription && currentStatus === "cancelled" && (
            <button
              type="button"
              className="subscription-btn subscription-btn--reactivate"
              onClick={() => {
                setLocalSubscription((prev: any) => {
                  const current = prev || apiSubscription;
                  return current ? { ...current, status: "active" } : current;
                });
                showFeedback(
                  "success",
                  "Suscripción reactivada correctamente.",
                );
              }}
            >
              <Check size={18} />
              <span>Reactivar suscripción</span>
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div
          className="subscription-confirm-overlay"
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            className="subscription-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="subscription-confirm__icon">
              <AlertTriangle size={28} />
            </div>
            <h3 className="subscription-confirm__title">
              ¿Cancelar suscripción?
            </h3>
            <p className="subscription-confirm__desc">
              Perderás el acceso a las funcionalidades de tu plan{" "}
              <strong>{currentPlan?.name}</strong> al finalizar el período de
              facturación actual.
            </p>
            <div className="subscription-confirm__actions">
              <button
                type="button"
                className="subscription-btn subscription-btn--cancel-confirm"
                onClick={handleCancelSubscription}
              >
                Sí, cancelar
              </button>
              <button
                type="button"
                className="subscription-btn subscription-btn--keep"
                onClick={() => setShowCancelConfirm(false)}
              >
                Mantener plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline plan cards */}
      {showPlans && (
        <div className="subscription-plans" ref={plansRef}>
          <h2 className="subscription-plans__title">Elegí tu nuevo plan</h2>
          <div className="subscription-plans__grid">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`subscription-plans__card ${activePlanId !== null && plan.id === activePlanId ? "subscription-plans__card--current" : ""} ${plan.recommended ? "subscription-plans__card--recommended" : ""}`}
              >
                {plan.recommended && (
                  <div className="subscription-plans__badge">
                    <Star size={12} fill="currentColor" />
                    Recomendado
                  </div>
                )}
                {activePlanId !== null && plan.id === activePlanId ? (
                  <div className="subscription-plans__current-badge">
                    Plan actual
                  </div>
                ) : null}

                <div className="subscription-plans__card-header">
                  <div
                    className={`subscription-plans__icon ${plan.recommended ? "subscription-plans__icon--premium" : ""}`}
                  >
                    {plan.recommended ? <Zap size={22} /> : <Crown size={22} />}
                  </div>
                  <h3 className="subscription-plans__name">{plan.name}</h3>
                  <p className="subscription-plans__desc">{plan.description}</p>
                </div>

                <div className="subscription-plans__pricing">
                  <span className="subscription-plans__currency">$</span>
                  <span className="subscription-plans__amount">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="subscription-plans__period">
                    /{plan.period}
                  </span>
                </div>

                <ul className="subscription-plans__features">
                  {plan.features.map((feat, i) => (
                    <li
                      key={i}
                      className={
                        feat.highlighted
                          ? "subscription-plans__feature--highlight"
                          : ""
                      }
                    >
                      <Check size={16} />
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`subscription-plans__select-btn ${activePlanId !== null && plan.id === activePlanId ? "subscription-plans__select-btn--disabled" : plan.recommended ? "subscription-plans__select-btn--primary" : ""} ${isSubmitting ? "subscription-plans__select-btn--loading" : ""}`}
                  disabled={
                    (activePlanId !== null && plan.id === activePlanId) ||
                    isSubmitting
                  }
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : activePlanId !== null && plan.id === activePlanId ? (
                    "Plan actual"
                  ) : (
                    "Elegir plan"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
