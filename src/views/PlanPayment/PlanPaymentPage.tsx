"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  Crown,
  Zap,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { plans, type Plan } from "../../data/plans";
import "./PlanPaymentPage.css";

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

export default function PlanPaymentPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const planId = params?.planId;

  const plan: Plan | undefined = plans.find((p) => p.id === planId);

  if (!plan) {
    return (
      <div className="plan-payment">
        <Navbar />
        <main className="plan-payment__main">
          <div className="plan-payment__not-found">
            <h2>Plan no encontrado</h2>
            <p>El plan solicitado no existe.</p>
            <button
              type="button"
              className="plan-payment__back-btn"
              onClick={() => router.push("/")}
            >
              <ArrowLeft size={18} />
              Volver al inicio
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handlePay = () => {
    alert(
      `Redirigiendo al pago del plan "${plan.name}" por $${formatPrice(plan.price)}/${plan.period}...`,
    );
  };

  return (
    <div className="plan-payment">
      <Navbar />

      <main className="plan-payment__main">
        <button
          type="button"
          className="plan-payment__back-btn"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="plan-payment__container">
          {/* Plan details */}
          <div className="plan-payment__details">
            <div className="plan-payment__plan-header">
              <div
                className={`plan-payment__plan-icon ${plan.recommended ? "plan-payment__plan-icon--premium" : ""}`}
              >
                {plan.recommended ? <Zap size={28} /> : <Crown size={28} />}
              </div>
              <div>
                <h1 className="plan-payment__plan-name">{plan.name}</h1>
                {plan.recommended && (
                  <span className="plan-payment__recommended-badge">
                    Recomendado
                  </span>
                )}
              </div>
            </div>

            <p className="plan-payment__plan-desc">{plan.description}</p>

            <div className="plan-payment__pricing-block">
              <span className="plan-payment__price">
                ${formatPrice(plan.price)}
              </span>
              <span className="plan-payment__period">/{plan.period}</span>
            </div>

            <div className="plan-payment__features-section">
              <h3 className="plan-payment__features-title">
                ¿Qué incluye este plan?
              </h3>
              <ul className="plan-payment__features-list">
                {plan.features.map((feat, i) => (
                  <li
                    key={i}
                    className={
                      feat.highlighted ? "plan-payment__feature--highlight" : ""
                    }
                  >
                    <Check size={18} />
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment card */}
          <div className="plan-payment__checkout">
            <div className="plan-payment__checkout-card">
              <h3 className="plan-payment__checkout-title">
                Resumen de tu plan
              </h3>

              <div className="plan-payment__checkout-row">
                <span>{plan.name}</span>
                <span className="plan-payment__checkout-price">
                  ${formatPrice(plan.price)}/{plan.period}
                </span>
              </div>

              <div className="plan-payment__checkout-divider" />

              <div className="plan-payment__checkout-row plan-payment__checkout-total">
                <span>Total mensual</span>
                <span>${formatPrice(plan.price)}</span>
              </div>

              <button
                type="button"
                className="plan-payment__pay-btn"
                onClick={handlePay}
              >
                <CreditCard size={18} />
                Pagar plan
              </button>

              <div className="plan-payment__secure">
                <ShieldCheck size={16} />
                <span>Pago seguro y encriptado</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
