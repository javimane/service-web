"use client";

import IdentityVerificationQr from "@/components/IdentityVerificationQr/IdentityVerificationQr";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Modal from "@/components/Modal/Modal";
import { SELL_VERIFICATION_NOTICE_EVENT } from "./sellVerificationNotice";
import { ROUTES } from "@/routes/paths";
import "./AccountAccessNotice.css";

type AccountAccessNoticeProps = {
  blocked: boolean;
  verificationRequired?: boolean;
  identityVerified?: boolean;
  cbuVerified?: boolean;
  reason?: string | null;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
};

export function AccountAccessNotice({
  blocked,
  verificationRequired = false,
  identityVerified,
  cbuVerified,
  reason,
  refresh,
  logout,
}: AccountAccessNoticeProps) {
  const pathname = usePathname();
  const [refreshing, setRefreshing] = useState(false);
  const [verificationDismissed, setVerificationDismissed] = useState(false);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const setupPending = typeof window !== "undefined" && (
    localStorage.getItem("show_setup_on_login") === "true" ||
    localStorage.getItem("show_plans_on_login") === "true"
  );
  const configuringAccount = pathname === ROUTES.accountSetup ||
    (pathname === ROUTES.login && typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("google_signup") === "1") ||
    (setupPending && !verificationRequested);

  useEffect(() => {
    if (!verificationRequired || blocked) return;

    const showNotice = () => {
      setVerificationRequested(true);
      setVerificationDismissed(false);
    };
    window.addEventListener(SELL_VERIFICATION_NOTICE_EVENT, showNotice);
    return () => window.removeEventListener(SELL_VERIFICATION_NOTICE_EVENT, showNotice);
  }, [verificationRequired, blocked]);

  const reload = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const missingVerifications = [
    !identityVerified && "DNI, rostro y mayoría de edad",
    !cbuVerified && "CBU de cobro a tu nombre o empresa",
  ].filter(Boolean).join("; ");
  const verificationHref = !cbuVerified
    ? `${ROUTES.dashboard}?view=commercial-data&tab=banking`
    : ROUTES.settings;
  const verificationAction = !cbuVerified
    ? "Ingresar CBU"
    : "Revisar datos personales";

  if (verificationRequired && !blocked) {
    if (configuringAccount) return null;
    const actions = (
      <>
        <a className="btn-secondary" href={verificationHref} onClick={() => setVerificationDismissed(true)}>
          {verificationAction}
        </a>
        <button className="btn-secondary" type="button" disabled={refreshing} onClick={reload}>
          {refreshing && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
          {refreshing ? "Actualizando…" : "Actualizar estado"}
        </button>
      </>
    );

    return (
      <Modal
        isOpen={!verificationDismissed}
        onClose={() => setVerificationDismissed(true)}
        title="Completá las verificaciones para vender"
        maxWidth="700px"
      >
        <div className="account-access__content account-access__content--dialog">
          <p>
            Para recibir nuevas ventas, completá: {missingVerifications}.
            Podés seguir gestionando tus pedidos anteriores.
          </p>
          {reason && <p>{reason}</p>}
          {identityVerified ? (
            <div className="account-access__actions">{actions}</div>
          ) : (
            <IdentityVerificationQr onVerified={refresh}>{actions}</IdentityVerificationQr>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <section role="alert" className={`account-access${blocked ? " account-access--blocked" : ""}`}>
      <div className="account-access__content">
        <h2>{blocked ? "Cuenta bloqueada" : "Cuenta en pausa"}</h2>
        <p>
          {blocked
            ? "Tu cuenta tiene acceso de consulta. No podés comprar, vender ni modificar datos. Contactá a Sercio para revisar el bloqueo y los pedidos pendientes."
            : "No podés publicar ni aceptar nuevas ventas hasta que se quite la pausa. Podés atender pedidos anteriores, reclamos y consultar tus liquidaciones."}
        </p>
        {reason && <p>{reason}</p>}
        <div className="account-access__actions">
          <button type="button" disabled={refreshing} onClick={reload}>
            {refreshing ? "Actualizando…" : "Actualizar estado"}
          </button>
          {blocked && <button type="button" onClick={logout}>Cerrar sesión</button>}
        </div>
      </div>
    </section>
  );
}
