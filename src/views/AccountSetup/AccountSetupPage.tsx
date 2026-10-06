"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getProfileAction, updateProfileAction } from "@/app/actions/profile";
import {
  getProfessionalDetailAction,
  getProfessionalMeAction,
} from "@/app/actions/professionals";
import { commerceService } from "@/services/commerceService";
import { getAccessToken } from "@/utils/auth";
import { ROUTES } from "@/routes/paths";
import DeliveryAddressSection from "@/views/Settings/sections/DeliveryAddressSection";
import BillingDataSection from "@/views/Settings/sections/BillingDataSection";
import CommercialDataSection from "@/views/Dashboard/sections/CommercialDataSection";
import ProfessionalProfileSection from "@/views/Dashboard/sections/ProfessionalProfileSection";
import "./AccountSetupPage.css";

type SetupStep = "personal" | "address" | "billing" | "commercial" | "profile" | "identity" | "done";

const buyerSteps: SetupStep[] = ["personal", "address", "billing", "done"];
const professionalSteps: SetupStep[] = [
  "personal",
  "address",
  "commercial",
  "profile",
  "identity",
];

const stepLabels: Record<SetupStep, string> = {
  personal: "Tus datos",
  address: "Dirección",
  billing: "Facturación",
  commercial: "Datos comerciales",
  profile: "Perfil público",
  identity: "Identidad",
  done: "Listo",
};

export default function AccountSetupPage() {
  const router = useRouter();
  const { user, sessionStatus, loading } = useAuth();
  const isProfessional = Boolean(
    sessionStatus?.is_professional ||
      sessionStatus?.professional_id ||
      sessionStatus?.subscription?.professional_id,
  );
  const steps = isProfessional ? professionalSteps : buyerSteps;
  const [step, setStep] = useState<SetupStep>("personal");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user?.id) router.replace(ROUTES.login);
  }, [loading, router, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const savedStep = localStorage.getItem(`account_setup_step_${user.id}`) as SetupStep | null;
    if (savedStep && steps.includes(savedStep)) setStep(savedStep);
    void getProfileAction({ id: user.id, token: getAccessToken() }).then((result) => {
      const profile = result?.data;
      if (!profile) return;
      const nameParts = String(profile.display_name || "").trim().split(/\s+/);
      setFirstName(profile.first_name || nameParts[0] || "");
      setLastName(profile.last_name || nameParts.slice(1).join(" ") || "");
      setPhone(profile.phone || profile.phone_number || "");
    });
  }, [user?.id, steps]);

  const currentIndex = Math.max(0, steps.indexOf(step));

  const moveTo = (next: SetupStep) => {
    setError("");
    setStep(next);
    if (user?.id) localStorage.setItem(`account_setup_step_${user.id}`, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const continueSetup = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!user?.id || busy) return;
    setBusy(true);
    setError("");
    try {
      if (step === "personal") {
        const cleanFirst = firstName.trim();
        const cleanLast = lastName.trim();
        const cleanPhone = phone.trim();
        if (!cleanFirst || !cleanLast || cleanPhone.replace(/\D/g, "").length < 8) {
          throw new Error("Ingresá nombre, apellido y un teléfono válido de al menos 8 dígitos.");
        }
        const result = await updateProfileAction({
          id: user.id,
          token: getAccessToken(),
          data: {
            first_name: cleanFirst,
            last_name: cleanLast,
            display_name: `${cleanFirst} ${cleanLast}`,
            phone: cleanPhone,
            phone_number: cleanPhone,
          },
        });
        if (result?.serverError) throw new Error(result.serverError);
      }
      if (step === "address") {
        const addresses = await commerceService.getUserAddresses();
        if (!Array.isArray(addresses) || addresses.length === 0) {
          throw new Error("Guardá una dirección de entrega para continuar.");
        }
      }
      if (step === "commercial") {
        const result = await getProfessionalMeAction({ token: getAccessToken() });
        const company = result?.data?.companies;
        const currentCompany = Array.isArray(company) ? company[0] : company;
        if (!currentCompany?.name?.trim() || !/^\d{11}$/.test(String(currentCompany.tax_code ?? ""))) {
          throw new Error("Guardá el nombre comercial y un CUIT/CUIL de 11 dígitos para continuar.");
        }
      }
      if (step === "profile") {
        const professionalId = Number(
          sessionStatus?.subscription?.professional_id ?? sessionStatus?.professional_id,
        );
        if (!professionalId) throw new Error("No encontramos tu perfil profesional. Volvé a iniciar sesión.");
        const result = await getProfessionalDetailAction({ id: professionalId });
        if (!result?.data?.bio?.trim()) {
          throw new Error("Guardá una descripción en tu perfil público para continuar.");
        }
      }
      if (step === "identity" || step === "done") {
        localStorage.removeItem("show_setup_on_login");
        localStorage.removeItem(`account_setup_step_${user.id}`);
        router.push(ROUTES.dashboard);
        return;
      }
      moveTo(steps[currentIndex + 1]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos continuar. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user?.id) return null;

  return (
    <>
      <Navbar />
      <main className="account-setup">
        <header className="account-setup__header">
          <span className="account-setup__eyebrow">CONFIGURACIÓN DE TU CUENTA</span>
          <h1>{isProfessional ? "Prepará tu perfil profesional" : "Prepará tu cuenta para comprar"}</h1>
          <p>Completá un paso a la vez. Podés volver más tarde: tus datos guardados permanecen en tu cuenta.</p>
          <div className="account-setup__progress" aria-label={`Paso ${currentIndex + 1} de ${steps.length}`}>
            {steps.map((item, index) => (
              <span
                key={item}
                className={`account-setup__progress-step ${index === currentIndex ? "account-setup__progress-step--current" : ""} ${index < currentIndex ? "account-setup__progress-step--complete" : ""}`}
                aria-current={index === currentIndex ? "step" : undefined}
              >
                <span className="account-setup__progress-number">{index < currentIndex ? <Check size={16} /> : index + 1}</span>
                {stepLabels[item]}
              </span>
            ))}
          </div>
        </header>

        <div className="account-setup__panel">
          <div className="account-setup__step-heading">
            <span>Paso {currentIndex + 1} de {steps.length}</span>
            <h2>{stepLabels[step]}</h2>
          </div>

          {step === "personal" && (
            <form id="account-setup-personal" className="account-setup__form" onSubmit={continueSetup}>
              <p>Usá tu nombre y apellido reales. Guardaremos el teléfono para entregas y contacto sobre tus compras.</p>
              <div className="account-setup__field-row">
                <label className="account-setup__field">Nombre
                  <input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
                </label>
                <label className="account-setup__field">Apellido
                  <input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
                </label>
              </div>
              <label className="account-setup__field">Teléfono
                <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
            </form>
          )}
          {step === "address" && (
            <div className="account-setup__embedded">
              <p>Agregá la dirección donde querés recibir tus compras. Si preferís retirar en tienda, igual podrás elegirlo al pagar.</p>
              <DeliveryAddressSection userId={user.id} />
            </div>
          )}
          {step === "billing" && (
            <div className="account-setup__embedded">
              <p>Si necesitás factura, completá tus datos ahora. También podés hacerlo más adelante desde Configuración.</p>
              <BillingDataSection userId={user.id} />
            </div>
          )}
          {step === "commercial" && (
            <div className="account-setup__embedded">
              <p>Completá el nombre, ubicación y medios de cobro de tu negocio. Estos son los mismos formularios de tu panel.</p>
              <CommercialDataSection />
            </div>
          )}
          {step === "profile" && (
            <div className="account-setup__embedded">
              <p>Contá qué hacés y guardá tu presentación para que los clientes puedan conocerte.</p>
              <ProfessionalProfileSection />
            </div>
          )}
          {step === "identity" && (
            <div className="account-setup__identity">
              <ShieldCheck size={40} aria-hidden="true" />
              <h3>Verificá tu identidad desde la aplicación Sercio</h3>
              <p>Ya cargaste tus datos. Abrí la aplicación principal con esta misma cuenta y seguí el paso de verificación: te pedirá una foto de tu DNI y una foto de tu rostro. Esto confirma tu identidad y te permite usar tu cuenta para comprar.</p>
              <p>Podés entrar al panel ahora y completar la verificación desde la app. La aprobación puede quedar pendiente mientras se revisan tus fotos.</p>
            </div>
          )}
          {step === "done" && (
            <div className="account-setup__identity">
              <Check size={40} aria-hidden="true" />
              <h3>Tu cuenta está preparada</h3>
              <p>Ya tenés tus datos personales y una dirección de entrega. Podés comprar o completar otros datos cuando quieras.</p>
            </div>
          )}
          {error && <p className="account-setup__error" role="alert">{error}</p>}
          <div className="account-setup__actions">
            {currentIndex > 0 && (
              <button type="button" className="account-setup__button account-setup__button--back" onClick={() => moveTo(steps[currentIndex - 1])} disabled={busy}>
                <ArrowLeft size={17} /> Anterior
              </button>
            )}
            <button
              type={step === "personal" ? "submit" : "button"}
              form={step === "personal" ? "account-setup-personal" : undefined}
              className="account-setup__button account-setup__button--next"
              onClick={step === "personal" ? undefined : () => void continueSetup()}
              disabled={busy}
            >
              {busy ? "Comprobando..." : step === "identity" || step === "done" ? "Ir a mi panel" : "Guardar y continuar"}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
