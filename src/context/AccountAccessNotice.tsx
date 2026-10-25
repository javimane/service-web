"use client";
import { useState } from "react";
import "./AccountAccessNotice.css";

export function AccountAccessNotice({ blocked, verificationRequired = false, identityVerified, arcaVerified, cbuVerified, reason, refresh, logout }: {
  blocked: boolean; verificationRequired?: boolean; identityVerified?: boolean; arcaVerified?: boolean; cbuVerified?: boolean; reason?: string | null;
  refresh: () => Promise<unknown>; logout: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const reload = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };
  return <section role="alert" className={`account-access${blocked ? " account-access--blocked" : ""}`}>
    <div className="account-access__content">
      <h2>{blocked ? "Cuenta bloqueada" : verificationRequired ? "Completá las verificaciones para vender" : "Cuenta en pausa"}</h2>
      <p>{blocked ? "Tu cuenta no puede operar. Contactá a Sercio para revisar el bloqueo."
        : verificationRequired ? `Para recibir nuevas ventas, completá: ${[
          !identityVerified && "DNI, rostro y mayoría de edad desde la app",
          !arcaVerified && "datos fiscales en ARCA",
          !cbuVerified && "CBU de cobro a tu nombre o empresa",
        ].filter(Boolean).join("; ")}. Podés seguir gestionando tus pedidos anteriores.`
        : "No podés vender ni aceptar nuevos pedidos hasta que se quite la pausa."}</p>
      {reason && <p>{reason}</p>}
      <div className="account-access__actions">
        {verificationRequired && <a href="/configuracion">Revisar datos personales</a>}
        <button type="button" disabled={refreshing} onClick={reload}>
          {refreshing ? "Actualizando…" : "Actualizar estado"}
        </button>
        {blocked && <button type="button" onClick={logout}>Cerrar sesión</button>}
      </div>
    </div>
  </section>;
}
