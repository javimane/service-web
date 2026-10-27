"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Zap, Check, Star, Loader2, AlertTriangle, X } from "lucide-react";
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
import { redirectToSubscriptionCheckout, subscriptionCheckoutUrl } from "@/utils/subscriptionCheckout";

import { useAuth } from "../../context/AuthContext";
import ProfessionalRequirementsDialog from "../../components/ProfessionalRequirementsDialog/ProfessionalRequirementsDialog";
import "../Dashboard/sections/SubscriptionSection.css";
import "./RegisterPlanSelection.css";

export default function RegisterPlanSelection({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { refreshSession, user, sessionStatus } = useAuth();
  const [plans, setPlans] = useState(staticPlans);
  const [mpPlans, setMpPlans] = useState<any>({});
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [planError, setPlanError] = useState("");
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const submittingRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [pricesResult, mpResult] = await Promise.allSettled([
          getSubscriptionPricesAction(),
          getMercadoPagoPlansAction(),
        ]);

        const pricesRes = pricesResult.status === "fulfilled" ? pricesResult.value : null;
        const mpRes = mpResult.status === "fulfilled" ? mpResult.value : null;
        const apiPrices = Array.isArray(pricesRes?.data) ? pricesRes.data : [];
        if (apiPrices.length > 0) {
          setPlans(mergePlansWithSubscriptionPrices(staticPlans, apiPrices));
        }

        if (mpRes?.data) {
          setMpPlans(mpRes.data);
        }
      } catch (err) {
        console.error("Error loading plans data:", err);
      } finally {
        setLoadingPlans(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const activatePlan = async (planId: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmittingPlanId(planId);
    setPlanError("");
    try {
      if (planId === "free" || planId === "gratuito") {
        const token = getAccessToken();
        const response = await createProfessionalMeAction({ token });

        if (response?.serverError || !response?.data) {
          throw new Error(response?.serverError || "No se pudo activar el plan gratuito. Volvé a intentarlo.");
        }

        localStorage.removeItem("show_plans_on_login");
        localStorage.setItem("show_setup_on_login", "true");
        // Mark setup before refreshing: activating the professional also enables verification notices.
        await refreshSession();
        onClose?.();
        router.refresh();
        router.push(ROUTES.accountSetup);
        return;
      }

      const isPremium = planId === "profesional-premium";
      const mpPlanId =
        mpPlans?.[isPremium ? "PROFESIONAL-PREMIUM" : "PROFESIONAL-BASICO"];

      if (!mpPlanId) {
        setPlanError("No pudimos cargar este plan. Intentá nuevamente en unos segundos.");
        setSubmittingPlanId(null);
        return;
      }

      const email = sessionStatus?.email || user?.email;
      if (!email) throw new Error("No pudimos obtener tu email. Volvé a iniciar sesión para elegir el plan.");
      const response = await createMercadoPagoSubscriptionAction({
        email,
        planId: mpPlanId,
      });

      const checkoutUrl = subscriptionCheckoutUrl(response?.data);
      if (checkoutUrl) {
        localStorage.removeItem("show_plans_on_login");
        localStorage.setItem("show_setup_on_login", "true");
        redirectToSubscriptionCheckout(checkoutUrl);
      } else {
        console.error("No se recibió link de pago", response);
        setPlanError("No se pudo iniciar el pago del plan. Volvé a intentarlo.");
        setSubmittingPlanId(null);
      }
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
      setPlanError(error instanceof Error ? error.message : "No se pudo seleccionar el plan. Volvé a intentarlo.");
    } finally {
      submittingRef.current = false;
      setSubmittingPlanId(null);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (!user && !sessionStatus) {
      onClose?.();
      router.push(ROUTES.register);
      return;
    }
    setPendingPlanId(planId);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="register-plan-selection__overlay" onClick={(event) => {
      if (event.target === event.currentTarget && submittingPlanId === null) onClose?.();
    }}>
    <section className="subscription-plans register-plan-selection" role="dialog" aria-modal="true" aria-labelledby="register-plan-selection-title">
      {onClose && <button type="button" className="register-plan-selection__close" aria-label="Cerrar planes" onClick={onClose} disabled={submittingPlanId !== null}><X size={20} /></button>}
      <h2 id="register-plan-selection-title" className="subscription-plans__title">
        Elegí tu plan profesional
      </h2>
      <p className="register-plan-selection__swipe-hint">Deslizá para comparar los planes.</p>
      {planError && <p className="register-plan-selection__error" role="alert">{planError}</p>}
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
              {plan.notice && (
                <div className="register-plan-selection__notice">
                  <AlertTriangle size={18} />
                  <span>{plan.notice}</span>
                </div>
              )}
            </div>

            <div className="subscription-plans__pricing">
              <span className="subscription-plans__currency">$</span>
              <span className="subscription-plans__amount">
                {plan.price.toLocaleString("es-AR")}
              </span>
              <span className="subscription-plans__period">/{plan.period}</span>
            </div>
            {plan.legend && (
              <div className="subscription-plans__legend">
                {plan.legend}
              </div>
            )}

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
              className={`subscription-plans__select-btn ${plan.recommended ? "subscription-plans__select-btn--primary" : ""} ${submittingPlanId === plan.id ? "subscription-plans__select-btn--loading" : ""}`}
              disabled={submittingPlanId !== null || (loadingPlans && !["free", "gratuito"].includes(plan.id))}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {submittingPlanId === plan.id ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Elegir plan"
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="subscription-plans__footer-links">
        Al registrarte aceptás nuestros{" "}
        <Link href={ROUTES.terms} target="_blank" rel="noopener noreferrer">
          Términos y Condiciones
        </Link>{" "}
        y{" "}
        <Link href={ROUTES.privacy} target="_blank" rel="noopener noreferrer">
          Políticas de Privacidad
        </Link>.
      </div>
    </section>
    <ProfessionalRequirementsDialog
        open={pendingPlanId !== null}
        onBack={() => setPendingPlanId(null)}
        onContinue={() => {
          const planId = pendingPlanId;
          setPendingPlanId(null);
          if (planId) void activatePlan(planId);
        }}
      />
    </div>, document.body
  );
}
