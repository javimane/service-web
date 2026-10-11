"use client";
import { useState } from "react";
import "./AccountAccessNotice.css";

export function AccountAccessNotice({ blocked, reason, refresh, logout }: {
  blocked: boolean; reason?: string | null;
  refresh: () => Promise<unknown>; logout: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const reload = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };
  return <section role="alert" className={`account-access${blocked ? " account-access--blocked" : ""}`}>
    <div className="account-access__content">
      <h2>{blocked ? "Cuenta bloqueada" : "Cuenta en pausa"}</h2>
      <p>{blocked ? "Tu cuenta no puede operar. Contactá a Sercio para revisar el bloqueo."
        : "No podés vender ni aceptar nuevos pedidos hasta que se quite la pausa."}</p>
      {reason && <p>{reason}</p>}
      <div className="account-access__actions">
        <button type="button" disabled={refreshing} onClick={reload}>
          {refreshing ? "Actualizando…" : "Actualizar estado"}
        </button>
        {blocked && <button type="button" onClick={logout}>Cerrar sesión</button>}
      </div>
    </div>
  </section>;
}
