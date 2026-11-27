"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo/BrandLogo";
import { useAuth, normalizeSessionPayload } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { ROUTES } from "@/routes/paths";
import RegisterPlanSelection from "@/views/Register/RegisterPlanSelection";
import "./EmailConfirmationPage.css";

export default function EmailConfirmationPage() {
  const params = useSearchParams();
  return <EmailConfirmationForm params={params} registrationEmail={params.get("email")} />;
}

type EmailConfirmationFormProps = {
  registrationEmail: string | null;
  params?: URLSearchParams;
  inModal?: boolean;
  onClose?: () => void;
};

export function EmailConfirmationForm({ registrationEmail, params, inModal, onClose }: EmailConfirmationFormProps) {
  const router = useRouter();
  const { refreshSession, setUser, setSessionStatus } = useAuth();
  const [email, setEmail] = useState(registrationEmail || "");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  const [resendAt, setResendAt] = useState(() => !params && registrationEmail ? now + 60_000 : 0);
  const cooldown = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const [showPlans, setShowPlans] = useState(false);
  const verificationRequest = useRef<Promise<unknown> | null>(null);
  const finished = useRef(false);
  const busy = useRef(false);

  const complete = async (response: unknown) => {
    if (finished.current) return;
    const { nextUser, nextSessionStatus } = normalizeSessionPayload(response);
    if (nextSessionStatus?.logistics_role === "delivery" ||
        ["delivery", "rider"].includes(nextUser?.user_metadata?.role)) {
      await authService.logout();
      throw new Error("Correo confirmado. Para usar tu cuenta de rider, ingresá en Sercio Envíos.");
    }
    localStorage.setItem("show_setup_on_login", "true");
    if (nextUser) setUser(nextUser);
    if (nextSessionStatus) setSessionStatus(nextSessionStatus);
    const status = await refreshSession() || nextSessionStatus;
    if (!status) throw new Error("Tu correo se confirmó, pero no pudimos cargar tu sesión. Ingresá para continuar.");
    finished.current = true;
    localStorage.setItem("was_logged_in", "true");
    if (status.is_professional) {
      setShowPlans(true);
    } else {
      onClose?.();
      router.replace(ROUTES.accountSetup);
    }
  };
  const completeRef = useRef(complete);
  useEffect(() => { completeRef.current = complete; });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown, now]);

  useEffect(() => {
    if (!params) return;
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    if (!tokenHash && !accessToken) return;
    if (type === "recovery" || fragment.get("type") === "recovery") {
      router.replace("/auth/confirm?" + params.toString() + window.location.hash);
      return;
    }
    if (tokenHash && type !== "email" && type !== "signup") {
      setError("El enlace de confirmación no es válido.");
      return;
    }
    let active = true;
    setPending(true);
    if (!verificationRequest.current) {
      verificationRequest.current = tokenHash
        ? authService.verifyOtp({ token_hash: tokenHash, type: type! })
        : authService.syncOAuth({ access_token: accessToken!, refresh_token: refreshToken || "" });
    }
    verificationRequest.current.then(async (response) => {
      if (!active) return;
      window.history.replaceState(null, "", window.location.pathname);
      await completeRef.current(response);
    }).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "El enlace venció o no es válido.");
    }).finally(() => setPending(false));
    return () => { active = false; };
  }, [params, router]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || pending || resending) return;
    if (!/^\d{6,10}$/.test(code)) {
      setError("Ingresá el código completo que recibiste por correo.");
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const response = await authService.verifyRegistrationEmail({ email: email.trim(), token: code });
      await complete(response);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo confirmar el código.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  const resend = async () => {
    if (busy.current || pending || resending || Date.now() < resendAt) return;
    const destination = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      setError("Ingresá un correo válido para reenviar el código.");
      return;
    }
    busy.current = true;
    setResending(true);
    setError("");
    setMessage("");
    try {
      await authService.resendRegistrationEmail(destination);
      setCode("");
      setMessage(`Si tu cuenta todavía está pendiente, vas a recibir un código nuevo en ${destination}. Revisá también el correo no deseado.`);
      const sentAt = Date.now();
      setNow(sentAt);
      setResendAt(sentAt + 60_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo reenviar el correo.");
    } finally {
      busy.current = false;
      setResending(false);
    }
  };

  return (
    <div className={`email-confirmation${inModal ? " email-confirmation--embedded" : ""}`}>
      <div className="email-confirmation__card">
        <BrandLogo />
        <h1>Confirmá tu correo</h1>
        {registrationEmail ? (
          <div className="email-confirmation__notice">
            <MailCheck size={20} aria-hidden="true" />
            <div>
              <strong>Código de verificación enviado</strong>
              <p>Te enviamos un código a <strong>{registrationEmail}</strong>. Ingresalo abajo para confirmar tu cuenta. Si no lo encontrás, revisá el correo no deseado.</p>
            </div>
          </div>
        ) : (
          <p>Ingresá el correo y el código de verificación para confirmar tu cuenta.</p>
        )}
        <form className="email-confirmation__form" onSubmit={verify}>
          {(params || !registrationEmail) && (
            <>
              <label htmlFor="confirmation-email">Correo electrónico</label>
              <input id="confirmation-email" type="email" autoComplete="email" required value={email}
                onChange={(event) => setEmail(event.target.value)} disabled={pending || resending} />
            </>
          )}
          <label htmlFor="confirmation-code">Código de confirmación</label>
          <input id="confirmation-code" inputMode="numeric" autoComplete="one-time-code" required autoFocus={!params}
            minLength={6} maxLength={10} value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            disabled={pending || resending} />
          {error && <p role="alert" className="email-confirmation__error">{error}</p>}
          {message && <p role="status">{message}</p>}
          <div className="email-confirmation__actions">
            <button type="submit" disabled={pending || resending} className="btn-primary">
              {pending && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
              {pending ? "Confirmando…" : "Confirmar y continuar"}
            </button>
            <button type="button" className="btn-secondary" onClick={resend}
              disabled={pending || resending || cooldown > 0 || !email.trim()}>
              {resending && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
              {resending ? "Reenviando…" : cooldown > 0 ? `Reenviar en ${cooldown} s` : "Reenviar código"}
            </button>
          </div>
        </form>
        <p>Si ya confirmaste tu correo, <Link href={ROUTES.login} onClick={onClose}>ingresá para continuar</Link>.</p>
        <Link href={ROUTES.home} onClick={onClose}>Volver al inicio</Link>
      </div>
      {showPlans && <RegisterPlanSelection onClose={() => {
        onClose?.();
        router.replace(`${ROUTES.dashboard}?view=subscription`);
      }} />}
    </div>
  );
}
