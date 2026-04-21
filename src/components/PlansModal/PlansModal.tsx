import { X, Check, Crown, Star, Zap } from "lucide-react";
import { useEffect } from "react";
import { plans, type Plan } from "../../data/plans";
import "./PlansModal.css";

type PlansModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

export default function PlansModal({ isOpen, onClose }: PlansModalProps) {
  const basicCheckoutUrl = import.meta.env.VITE_MP_BASIC_CHECKOUT_URL;
  const premiumCheckoutUrl = import.meta.env.VITE_MP_PREMIUM_CHECKOUT_URL;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPlan = (plan: Plan) => {
    const checkoutUrl =
      plan.id === "profesional-premium" ? premiumCheckoutUrl : basicCheckoutUrl;

    if (!checkoutUrl) {
      console.error(`Checkout URL no configurada para el plan: ${plan.id}`);
      return;
    }

    onClose();
    window.location.assign(checkoutUrl);
  };

  return (
    <div className="plans-modal-overlay" onClick={onClose}>
      <div className="plans-modal" onClick={(e) => e.stopPropagation()}>
        <button className="plans-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="plans-modal__header">
          <div className="plans-modal__icon-wrapper">
            <Crown size={28} />
          </div>
          <h2 className="plans-modal__title">Elegí tu plan</h2>
          <p className="plans-modal__subtitle">
            Potenciá tu presencia profesional y llegá a más clientes.
          </p>
        </div>

        <div className="plans-modal__grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plans-modal__card ${plan.recommended ? "plans-modal__card--recommended" : ""}`}
            >
              {plan.recommended && (
                <div className="plans-modal__badge">
                  <Star size={12} fill="currentColor" />
                  Recomendado
                </div>
              )}

              <div className="plans-modal__card-header">
                <div className="plans-modal__plan-icon">
                  {plan.recommended ? <Zap size={22} /> : <Crown size={22} />}
                </div>
                <h3 className="plans-modal__plan-name">{plan.name}</h3>
                <p className="plans-modal__plan-desc">{plan.description}</p>
              </div>

              <div className="plans-modal__pricing">
                <span className="plans-modal__currency">$</span>
                <span className="plans-modal__amount">
                  {formatPrice(plan.price)}
                </span>
                <span className="plans-modal__period">/{plan.period}</span>
              </div>

              <ul className="plans-modal__features">
                {plan.features.map((feat, i) => (
                  <li
                    key={i}
                    className={
                      feat.highlighted ? "plans-modal__feature--highlight" : ""
                    }
                  >
                    <Check size={16} />
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`plans-modal__select-btn ${plan.recommended ? "plans-modal__select-btn--primary" : ""}`}
                onClick={() => handleSelectPlan(plan)}
              >
                Elegir plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
