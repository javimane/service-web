"use client";
import { X, Check, Crown, Star, Zap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  plans,
  mergePlansWithSubscriptionPrices,
  type Plan,
} from "../../data/plans";
import { getSubscriptionPricesAction } from "../../app/actions/plans";
import { createProfessionalMeAction } from "../../app/actions/professionals";
import { useAuth } from "../../context/AuthContext";
import { getAccessToken } from "../../utils/auth";
import "./PlansModal.css";

type PlansModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

export default function PlansModal({ isOpen, onClose }: PlansModalProps) {
  const basicCheckoutUrl = process.env.NEXT_PUBLIC_MP_BASIC_CHECKOUT_URL;
  const premiumCheckoutUrl = process.env.NEXT_PUBLIC_MP_PREMIUM_CHECKOUT_URL;
  const [displayPlans, setDisplayPlans] = useState<Plan[]>(plans);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getSubscriptionPricesAction()
      .then((result) => {
        const prices = result?.data;
        if (Array.isArray(prices) && prices.length > 0) {
          setDisplayPlans(mergePlansWithSubscriptionPrices(plans, prices));
        }
      })
      .catch(() => {
        // fallback prices ya están en el estado inicial
      });
  }, []);

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

  const { refreshSession } = useAuth();

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === "free" || plan.id === "gratuito") {
      setIsSubmitting(true);
      try {
        const token = getAccessToken();
        await createProfessionalMeAction({ token });
        // Refresh the client session so AuthContext picks up the new professional status
        await refreshSession();
        onClose();
      } catch (error) {
        console.error("Error al seleccionar plan gratuito:", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
          {displayPlans.map((plan) => (
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
                className={`plans-modal__select-btn ${plan.recommended ? "plans-modal__select-btn--primary" : ""} ${isSubmitting ? "plans-modal__select-btn--loading" : ""}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Elegir plan"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
