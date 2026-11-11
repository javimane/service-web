import { useState, useEffect } from "react";
import { X, Settings, UserRound, ChevronRight, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../../routes/paths";
import { useAuth } from "../../../context/AuthContext";
import "./DashboardOnboarding.css";

export default function DashboardOnboarding() {
  const router = useRouter();
  const { hasProfessionalSubscription, sessionStatus } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [type, setType] = useState<"professional" | "client" | null>(null);

  useEffect(() => {
    if (!sessionStatus) return;
    const isDismissed = localStorage.getItem("dashboard_tutorial_dismissed");

    if (isDismissed) return;

    // Show if professional with subscription OR if regular non-professional user
    if (hasProfessionalSubscription) {
      setType("professional");
      setIsVisible(true);
    } else if (!sessionStatus.is_professional) {
      setType("client");
      setIsVisible(true);
    }
  }, [hasProfessionalSubscription, sessionStatus]);

  if (!isVisible || !type) return null;

  const handleDismiss = () => {
    localStorage.setItem("dashboard_tutorial_dismissed", "true");
    setIsVisible(false);
  };

  return (
    <div className="dashboard-onboarding animate-slide-down">
      <div className="dashboard-onboarding__header">
        <h3>
          {type === "professional"
            ? "¡Te damos la bienvenida a tu Panel Profesional! 🚀"
            : "¡Te damos la bienvenida a Sercio! 👋"}
        </h3>
        <button
          className="dashboard-onboarding__close"
          onClick={handleDismiss}
          title="Cerrar sugerencia"
        >
          <X size={20} />
        </button>
      </div>

      <p className="dashboard-onboarding__desc">
        {type === "professional"
            ? "Completá tu cuenta paso por paso: datos personales, comerciales, perfil público y verificación de identidad."
            : "Completá tu teléfono, dirección y datos de facturación paso por paso para comprar con más facilidad."}
      </p>

      <div className="dashboard-onboarding__steps">
        {type === "professional" ? (
          <>
            <div
              className="dashboard-onboarding__step"
              onClick={() => router.push(ROUTES.accountSetup)}
            >
              <div className="dashboard-onboarding__step-icon">
                <Settings size={24} />
              </div>
              <div className="dashboard-onboarding__step-content">
                <h4>Continuar configuración guiada</h4>
                <p>
                  Guardá tus datos comerciales y prepará tu perfil para recibir clientes.
                </p>
              </div>
              <ChevronRight
                className="dashboard-onboarding__step-arrow"
                size={20}
              />
            </div>

            <div
              className="dashboard-onboarding__step"
              onClick={() => router.push(`${ROUTES.dashboard}?view=profile`)}
            >
              <div className="dashboard-onboarding__step-icon">
                <UserRound size={24} />
              </div>
              <div className="dashboard-onboarding__step-content">
                <h4>2. Personaliza tu Perfil Público</h4>
                <p>
                  Sube tu logo, agrega una descripción atractiva, horarios y
                  muestra tu galería de fotos o videos.
                </p>
              </div>
              <ChevronRight
                className="dashboard-onboarding__step-arrow"
                size={20}
              />
            </div>
          </>
        ) : (
          <>
            <div
              className="dashboard-onboarding__step"
              onClick={() => router.push(ROUTES.accountSetup)}
            >
              <div className="dashboard-onboarding__step-icon">
                <Settings size={24} />
              </div>
              <div className="dashboard-onboarding__step-content">
                <h4>Continuar configuración guiada</h4>
                <p>
                  Agregá tu teléfono y una dirección de entrega para tus compras.
                </p>
              </div>
              <ChevronRight
                className="dashboard-onboarding__step-arrow"
                size={20}
              />
            </div>

            <div
              className="dashboard-onboarding__step"
              onClick={() =>
                router.push(`${ROUTES.dashboard}?view=job-requests`)
              }
            >
              <div className="dashboard-onboarding__step-icon">
                <Briefcase size={24} />
              </div>
              <div className="dashboard-onboarding__step-content">
                <h4>2. Sube una Solicitud de Trabajo</h4>
                <p>
                  Publica lo que necesitas hacer para que los profesionales
                  capacitados se comuniquen directamente contigo para ayudarte.
                </p>
              </div>
              <ChevronRight
                className="dashboard-onboarding__step-arrow"
                size={20}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
