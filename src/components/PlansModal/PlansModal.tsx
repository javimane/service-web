"use client";
import { X, Check, Crown, Star, Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../routes/paths";
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

import { useQuery } from "@tanstack/react-query";
import {
  getMercadoPagoPlansAction,
  createMercadoPagoSubscriptionAction,
} from "../../app/actions/mercadopago";

type PlansModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

export default function PlansModal({ isOpen, onClose }: PlansModalProps) {
  const router = useRouter();
  const [displayPlans, setDisplayPlans] = useState<Plan[]>(plans);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { refreshSession, sessionStatus } = useAuth();

  const { data: mpPlans } = useQuery({
    queryKey: ["mercadopago-plans"],
    queryFn: async () => {
      const res = await getMercadoPagoPlansAction();
      return res?.data || {};
    },
    staleTime: 1000 * 60 * 60,
  });

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

  const handleSelectPlan = async (plan: Plan) => {
    if (!sessionStatus) {
      onClose();
      router.push(ROUTES.register);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (plan.id === "free" || plan.id === "gratuito") {
        const token = getAccessToken();
        await createProfessionalMeAction({ token });
        // Refresh the client session so AuthContext picks up the new professional status
        await refreshSession();
        onClose();
        router.push(ROUTES.dashboard + "?welcome=true");
        return;
      }

      const isPremium = plan.id === "profesional-premium";
      const mpPlanId =
        mpPlans?.[isPremium ? "PROFESIONAL-PREMIUM" : "PROFESIONAL-BASICO"];

      if (!mpPlanId) {
        console.error(
          `ID de Mercado Pago no encontrado para el plan: ${plan.id}`,
        );
        setErrorMsg(
          "Intente de nuevo o si el error persiste contacte con soporte.",
        );
        return;
      }

      const response = await createMercadoPagoSubscriptionAction({
        email: sessionStatus?.email || "",
        planId: mpPlanId,
      });

      if (response?.data?.initPoint) {
        onClose();
        window.location.assign(response.data.initPoint);
      } else {
        console.error("No se recibió link de pago", response);
        setErrorMsg(
          "Intente de nuevo o si el error persiste contacte con soporte.",
        );
      }
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
      setErrorMsg(
        "Intente de nuevo o si el error persiste contacte con soporte.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          {errorMsg && (
            <div
              style={{
                color: "var(--error-color)",
                marginTop: "1rem",
                backgroundColor: "rgba(250, 82, 82, 0.1)",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                textAlign: "center",
              }}
            >
              {errorMsg}
            </div>
          )}
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
