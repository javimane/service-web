"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { sileo } from "sileo";
import Image from "next/image";
import { Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { commerceService } from "@/services/commerceService";
import "./IdentityVerificationQr.css";

type Props = {
  onVerified: () => Promise<unknown>;
  children?: ReactNode;
};

export default function IdentityVerificationQr({ onVerified, children }: Props) {
  const [link, setLink] = useState<{ url: string; qr: string }>();
  const [pending, setPending] = useState<"start" | "check" | null>(null);
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);

  const start = async () => {
    setPending("start");
    setMessage("");
    try {
      const session = await commerceService.startIdentityVerification();
      const url = new URL(session.url);
      if (url.protocol !== "https:" || url.hostname !== "verify.didit.me") {
        throw new Error("No pudimos abrir el enlace de verificación de Didit.");
      }
      const qr = await QRCode.toDataURL(url.href, { width: 224, margin: 4 });
      setLink({ url: url.href, qr });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos iniciar la verificación.");
    } finally {
      setPending(null);
    }
  };

  const checkInProgress = useRef(false);
  const confirmationHandled = useRef(false);

  const check = async (manual: boolean, isActive = () => true) => {
    if (checkInProgress.current || confirmationHandled.current) return;
    checkInProgress.current = true;
    if (manual) {
      setPending("check");
      setMessage("");
    }

    try {
      const status = manual
        ? await commerceService.syncIdentityVerification()
        : await commerceService.getIdentityVerificationStatus();
      if (!isActive()) return;
      if (status.purchase_eligible) {
        await onVerified();
        confirmationHandled.current = true;
        sileo.success({ title: "Identidad verificada correctamente" });
        setVerified(true);
        setLink(undefined);
      } else if (manual || status.session?.rejection_reason) {
        setMessage(
          status.session?.rejection_reason ||
            "La verificación todavía no está aprobada. Si ya la completaste, volvé a consultar en unos instantes.",
        );
      }
    } catch {
      if (manual) setMessage("No pudimos actualizar el estado. Intentá nuevamente.");
    } finally {
      checkInProgress.current = false;
      if (manual) setPending(null);
    }
  };

  const checkAutomatically = (isActive: () => boolean) => {
    if (document.visibilityState === "visible" && pending !== "start") {
      void check(false, isActive);
    }
  };
  const automaticCheckRef = useRef(checkAutomatically);

  useEffect(() => {
    automaticCheckRef.current = checkAutomatically;
  });

  useEffect(() => {
    if (!link) return;
    let active = true;
    const updateStatus = () => automaticCheckRef.current(() => active);
    const timer = window.setInterval(updateStatus, 5000);
    window.addEventListener("focus", updateStatus);
    document.addEventListener("visibilitychange", updateStatus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", updateStatus);
      document.removeEventListener("visibilitychange", updateStatus);
    };
  }, [link]);

  if (verified) return <p role="status">Tu identidad está verificada.</p>;

  return (
    <div className="identity-verification-qr">
      {link && (
        <>
          <p>Escaneá el QR con la cámara de tu teléfono para verificar tu DNI y tu rostro en el navegador.</p>
          <Image src={link.qr} alt="Código QR para abrir la verificación de identidad en el teléfono" width={224} height={224} unoptimized />
        </>
      )}
      <div className="identity-verification-qr__actions">
        {link ? (
          <>
            <a className="btn-primary" href={link.url} target="_blank" rel="noreferrer">
              Abrir en este dispositivo
            </a>
            <button type="button" className="btn-secondary" disabled={pending !== null} onClick={() => void check(true)}>
              {pending === "check" && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
              {pending === "check" ? "Consultando…" : "Ya completé la verificación"}
            </button>
            <button type="button" className="link-btn" disabled={pending !== null} onClick={start}>
              {pending === "start" && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
              {pending === "start" ? "Generando…" : "Generar otro QR"}
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" disabled={pending !== null} onClick={start}>
            {pending === "start" ? <Loader2 size={16} className="btn-spinner" aria-hidden="true" /> : <QrCode size={18} aria-hidden="true" />}
            {pending === "start" ? "Generando…" : "Verificar identidad con QR"}
          </button>
        )}
        {children}
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
