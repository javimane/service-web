"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Modal from "@/components/Modal/Modal";
import { SELL_VERIFICATION_NOTICE_EVENT } from "./sellVerificationNotice";
import { ROUTES } from "@/routes/paths";
import "./AccountAccessNotice.css";

type AccountAccessNoticeProps = {
  blocked: boolean;
  verificationRequired?: boolean;
  identityVerified?: boolean;
  arcaVerified?: boolean;
  cbuVerified?: boolean;
  reason?: string | null;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
};

export function AccountAccessNotice({
  blocked,
  verificationRequired = false,
  identityVerified,
  arcaVerified,
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
    !identityVerified && "DNI, rostro y mayoría de edad desde la app",
    !arcaVerified && "datos fiscales en ARCA",
    !cbuVerified && "CBU de cobro a tu nombre o empresa",
  ].filter(Boolean).join("; ");
  const verificationHref = !cbuVerified
    ? `${ROUTES.dashboard}?view=commercial-data&tab=banking`
    : !arcaVerified
      ? `${ROUTES.dashboard}?view=commercial-data`
      : ROUTES.settings;
  const verificationAction = !cbuVerified
    ? "Verificar CBU en Datos comerciales"
    : !arcaVerified
      ? "Verificar datos en ARCA"
      : "Revisar datos personales";

  if (verificationRequired && !blocked) {
    if (configuringAccount) return null;
    return (
      <Modal
        isOpen={!verificationDismissed}
        onClose={() => setVerificationDismissed(true)}
        title="Completá las verificaciones para vender"
        maxWidth="600px"
      >
        <div className="account-access__content account-access__content--dialog">
          <p>
            Para recibir nuevas ventas, completá: {missingVerifications}.
            Podés seguir gestionando tus pedidos anteriores.
          </p>
          {reason && <p>{reason}</p>}
          <div className="account-access__actions">
            <a href={verificationHref} onClick={() => setVerificationDismissed(true)}>
              {verificationAction}
            </a>
            <button type="button" disabled={refreshing} onClick={reload}>
              {refreshing ? "Actualizando…" : "Actualizar estado"}
            </button>
            <button
              type="button"
              data-action-tone="cancel"
              className="account-access__close"
              onClick={() => setVerificationDismissed(true)}
            >
              Cerrar
            </button>
          </div>
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
            ? "Tu cuenta no puede operar. Contactá a Sercio para revisar el bloqueo."
            : "No podés vender ni aceptar nuevos pedidos hasta que se quite la pausa."}
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
