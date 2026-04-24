import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import {
  getPlansWithApiPrices,
  plans as staticPlans,
  type Plan,
} from "../../../data/plans";
import { type Subscription } from "../../../data/subscription";
import { useAuth } from "../../../context/AuthContext";
import "./SubscriptionSection.css";

// Mapeo de los nombres de plan del API a los IDs internos
const planNameToId: Record<string, string> = {
  standard: "profesional-basico",
  premium: "profesional-premium",
};

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
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
  const { sessionStatus } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>(staticPlans);
  const [showPlans, setShowPlans] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      const nextPlans = await getPlansWithApiPrices();
      if (isMounted) setAvailablePlans(nextPlans);
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentStatus = normalizeSubscriptionStatus(
    subscription?.status ?? sessionStatus?.subscription?.status,
  );
  const hasSubscription = Boolean(sessionStatus?.subscription);

  const isActiveProPlan =
    Boolean(sessionStatus?.is_professional) &&
    Boolean(sessionStatus?.professional_active) &&
    currentStatus === "active";

  // Plan activo según el API (null si no hay suscripción)
  const activePlanId: string | null = sessionStatus?.subscription?.plan
    ? (planNameToId[sessionStatus.subscription.plan] ?? null)
    : null;

  // Fechas desde el API cuando estén disponibles
  const displayStartDate: string =
    sessionStatus?.subscription?.started_at ?? subscription?.startDate ?? "";
  const displayNextPaymentDate: string =
    sessionStatus?.subscription?.expires_at ??
    subscription?.nextPaymentDate ??
    "";

  const displayAmount =
    sessionStatus?.subscription?.amount_paid ?? subscription?.amount ?? 0;

  const basicCheckoutUrl = import.meta.env.VITE_MP_BASIC_CHECKOUT_URL;
  const premiumCheckoutUrl = import.meta.env.VITE_MP_PREMIUM_CHECKOUT_URL;

  const currentPlan: Plan | undefined =
    (hasSubscription && activePlanId
      ? availablePlans.find((p) => p.id === activePlanId)
      : undefined) ??
    (hasSubscription && subscription?.plan
      ? availablePlans.find((p) => p.id === subscription.plan)
      : undefined);

  const handleCancelSubscription = () => {
    setSubscription((prev) => ({ ...prev, status: "cancelled" }));
    setShowCancelConfirm(false);
  };

  const getCheckoutUrlByPlanId = (planId: string) => {
    if (planId === "profesional-premium") return premiumCheckoutUrl;
    if (planId === "profesional-basico") return basicCheckoutUrl;
    return "";
  };

  const handleSelectPlan = (planId: string) => {
    const checkoutUrl = getCheckoutUrlByPlanId(planId);
    if (!checkoutUrl) {
      console.error(`Checkout URL no configurada para el plan: ${planId}`);
      return;
    }

    window.location.assign(checkoutUrl);
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
                  <span className="subscription-detail__label">Precio mensual</span>
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
                  <span className="subscription-detail__label">Próximo pago</span>
                  <span className="subscription-detail__value">
                    {currentStatus === "cancelled" || !sessionStatus?.subscription
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
                    {sessionStatus?.subscription
                      ? formatDate(displayStartDate)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="subscription-card__features">
              <h3 className="subscription-card__features-title">Tu plan incluye</h3>
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
                <h2 className="subscription-card__plan-name">Sin suscripción activa</h2>
                <p className="subscription-card__plan-desc">
                  Suscribite para activar tu perfil profesional y acceder a todos
                  los beneficios.
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
              onClick={() =>
                setSubscription((prev) => ({ ...prev, status: "active" }))
              }
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
                  className={`subscription-plans__select-btn ${activePlanId !== null && plan.id === activePlanId ? "subscription-plans__select-btn--disabled" : plan.recommended ? "subscription-plans__select-btn--primary" : ""}`}
                  disabled={activePlanId !== null && plan.id === activePlanId}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {activePlanId !== null && plan.id === activePlanId
                    ? "Plan actual"
                    : "Elegir plan"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
