import { useState, useRef } from "react";
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
import { useNavigate } from "react-router-dom";
import { plans, type Plan } from "../../../data/plans";
import {
  mockSubscription,
  type Subscription,
} from "../../../data/subscription";
import "./SubscriptionSection.css";

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

const statusLabels: Record<Subscription["status"], string> = {
  active: "Activa",
  cancelled: "Cancelada",
  past_due: "Pago pendiente",
};

const statusIcons: Record<Subscription["status"], typeof Check> = {
  active: Check,
  cancelled: XCircle,
  past_due: AlertTriangle,
};

export default function SubscriptionSection() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(mockSubscription);
  const [showPlans, setShowPlans] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  const currentPlan: Plan | undefined = plans.find(
    (p) => p.id === subscription.planId,
  );

  const handleCancelSubscription = () => {
    setSubscription((prev) => ({ ...prev, status: "cancelled" }));
    setShowCancelConfirm(false);
  };

  if (!currentPlan) return null;

  const StatusIcon = statusIcons[subscription.status];

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
            className={`subscription-card__status subscription-card__status--${subscription.status}`}
          >
            <StatusIcon size={14} />
            <span>{statusLabels[subscription.status]}</span>
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
                ${formatPrice(subscription.amount)}/{currentPlan.period}
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
                {subscription.status === "cancelled"
                  ? "—"
                  : formatDate(subscription.nextPaymentDate)}
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
                {formatDate(subscription.startDate)}
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
            <span>{showPlans ? "Ocultar planes" : "Cambiar de plan"}</span>
            {showPlans && <ChevronUp size={16} />}
          </button>

          {subscription.status === "active" && (
            <button
              type="button"
              className="subscription-btn subscription-btn--cancel"
              onClick={() => setShowCancelConfirm(true)}
            >
              <XCircle size={18} />
              <span>Cancelar suscripción</span>
            </button>
          )}

          {subscription.status === "cancelled" && (
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
              <strong>{currentPlan.name}</strong> al finalizar el período de
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
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`subscription-plans__card ${plan.id === subscription.planId ? "subscription-plans__card--current" : ""} ${plan.recommended ? "subscription-plans__card--recommended" : ""}`}
              >
                {plan.recommended && (
                  <div className="subscription-plans__badge">
                    <Star size={12} fill="currentColor" />
                    Recomendado
                  </div>
                )}
                {plan.id === subscription.planId && (
                  <div className="subscription-plans__current-badge">
                    Plan actual
                  </div>
                )}

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
                  className={`subscription-plans__select-btn ${plan.id === subscription.planId ? "subscription-plans__select-btn--disabled" : plan.recommended ? "subscription-plans__select-btn--primary" : ""}`}
                  disabled={plan.id === subscription.planId}
                  onClick={() => navigate(`/plan/${plan.id}`)}
                >
                  {plan.id === subscription.planId
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
