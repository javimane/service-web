"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, Zap, Check, Star, Loader2 } from "lucide-react";
import {
  plans as staticPlans,
  mergePlansWithSubscriptionPrices,
} from "../../data/plans";
import { getSubscriptionPricesAction } from "@/app/actions/plans";
import {
  getMercadoPagoPlansAction,
  createMercadoPagoSubscriptionAction,
} from "@/app/actions/mercadopago";
import { createProfessionalMeAction } from "@/app/actions/professionals";
import { getAccessToken } from "@/utils/auth";
import { ROUTES } from "../../routes/paths";

export default function RegisterPlanSelection() {
  const router = useRouter();
  const [plans, setPlans] = useState(staticPlans);
  const [mpPlans, setMpPlans] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [pricesRes, mpRes] = await Promise.all([
          getSubscriptionPricesAction(),
          getMercadoPagoPlansAction(),
        ]);

        const apiPrices = Array.isArray(pricesRes?.data) ? pricesRes.data : [];
        if (apiPrices.length > 0) {
          setPlans(mergePlansWithSubscriptionPrices(staticPlans, apiPrices));
        }

        if (mpRes?.data) {
          setMpPlans(mpRes.data);
        }
      } catch (err) {
        console.error("Error loading plans data:", err);
      }
    }
    loadData();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setIsSubmitting(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem("show_plans_on_login");
    }
    try {
      if (planId === "free" || planId === "gratuito") {
        const token = getAccessToken();
        const response = await createProfessionalMeAction({ token });

        if (response?.serverError) {
          console.warn("Notice creating professional:", response.serverError);
          // If the profile already exists (e.g. from the registration itself), it might throw an error.
          // We still MUST redirect the user to the dashboard so they aren't stuck.
        }

        // Force a hard navigation so the entire app (including server components)
        // recognizes the new session and professional role immediately.
        window.location.href = `${ROUTES.dashboard}?welcome=true`;
        return;
      }

      const isPremium = planId === "profesional-premium";
      const mpPlanId =
        mpPlans?.[isPremium ? "PROFESIONAL-PREMIUM" : "PROFESIONAL-BASICO"];

      if (!mpPlanId) {
        console.error(
          `ID de Mercado Pago no encontrado para el plan: ${planId}`,
        );
        setIsSubmitting(false);
        router.push(`${ROUTES.dashboard}?welcome=true`);
        return;
      }

      const response = await createMercadoPagoSubscriptionAction({
        email: "auto-detect", // Backend AuthGuard uses user from token anyway, or we send a dummy
        planId: mpPlanId,
      });

      if (response?.data?.link) {
        window.open(response.data.link, "_blank");
        window.location.href = `${ROUTES.dashboard}?welcome=true`;
      } else {
        console.error("No se recibió link de pago", response);
        setIsSubmitting(false);
        router.push(`${ROUTES.dashboard}?welcome=true`);
      }
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
      setIsSubmitting(false);
      router.push(ROUTES.dashboard);
    }
  };

  return (
    <div
      className="subscription-plans"
      style={{
        background: "var(--bg-color)",
        padding: "24px",
        borderRadius: "var(--radius-xl)",
        maxWidth: "1000px",
        width: "100%",
        margin: "auto",
      }}
    >
      <h2
        className="subscription-plans__title"
        style={{ textAlign: "center", marginBottom: "var(--space-6)" }}
      >
        Elegí tu plan profesional
      </h2>
      <div className="subscription-plans__grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`subscription-plans__card ${plan.recommended ? "subscription-plans__card--recommended" : ""}`}
          >
            {plan.recommended && (
              <div className="subscription-plans__badge">
                <Star size={12} fill="currentColor" />
                Recomendado
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
                {plan.price.toLocaleString("es-AR")}
              </span>
              <span className="subscription-plans__period">/{plan.period}</span>
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
              className={`subscription-plans__select-btn ${plan.recommended ? "subscription-plans__select-btn--primary" : ""} ${isSubmitting ? "subscription-plans__select-btn--loading" : ""}`}
              disabled={isSubmitting}
              onClick={() => handleSelectPlan(plan.id)}
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
  );
}
