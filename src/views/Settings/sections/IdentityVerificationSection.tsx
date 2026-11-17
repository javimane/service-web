"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { commerceService } from "@/services/commerceService";
import IdentityVerificationQr from "@/components/IdentityVerificationQr/IdentityVerificationQr";
import "./IdentityVerificationSection.css";

export default function IdentityVerificationSection() {
  const { user, refreshSession } = useAuth();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["settings-identity-verification", user?.id],
    queryFn: commerceService.getIdentityVerificationStatus,
    enabled: Boolean(user?.id),
  });

  return (
    <article id="verificacion-identidad" className="settings-card settings-card--wide identity-verification-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <ShieldCheck size={22} aria-hidden="true" />
          <h2>Verificación de identidad y edad</h2>
        </div>
      </div>
      {isPending ? (
        <p role="status"><Loader2 size={16} className="btn-spinner" aria-hidden="true" /> Consultando tu verificación…</p>
      ) : isError ? (
        <div>
          <p role="alert">No pudimos consultar tu verificación.</p>
          <button type="button" className="btn-secondary" onClick={() => void refetch()}>Volver a consultar</button>
        </div>
      ) : data?.purchase_eligible ? (
        <p role="status">Tu identidad y mayoría de edad están verificadas.</p>
      ) : (
        <>
          <p>Verificá tu DNI y tu rostro para comprar y vender. Escaneá el QR y completá el proceso en el navegador de tu teléfono.</p>
          <p>Primero guardá tu nombre y apellido personales y tu DNI en Datos Personales.</p>
          {data?.session?.rejection_reason && <p role="status">{data.session.rejection_reason}</p>}
          <IdentityVerificationQr key={user?.id} onVerified={async () => {
            await Promise.all([refreshSession(), refetch()]);
          }} />
        </>
      )}
    </article>
  );
}
