"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { useAuth } from "@/context/AuthContext";
import { IDENTITY_VERIFICATION_REQUIRED_EVENT } from "@/utils/identityVerification";
import "./PurchaseVerificationPrompt.css";

export default function PurchaseVerificationPrompt() {
  const { user, isAgeVerified, refreshSession } = useAuth();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const storageKey = user?.id ? `identity-verification-pending:${user.id}` : null;

  useEffect(() => {
    const showPrompt = () => {
      setVisible(true);
      setModalOpen(true);
      setMessage("");
      if (storageKey) window.sessionStorage.setItem(storageKey, "true");
    };
    window.addEventListener(IDENTITY_VERIFICATION_REQUIRED_EVENT, showPrompt);
    return () => window.removeEventListener(IDENTITY_VERIFICATION_REQUIRED_EVENT, showPrompt);
  }, [storageKey]);

  useEffect(() => {
    if (isAgeVerified || !user) {
      setVisible(false);
      setModalOpen(false);
      setMessage("");
      if (isAgeVerified && storageKey) window.sessionStorage.removeItem(storageKey);
    } else if (storageKey && window.sessionStorage.getItem(storageKey) === "true") {
      setVisible(true);
    }
  }, [isAgeVerified, user, storageKey]);

  const checkVerification = async () => {
    if (checking) return;
    setChecking(true);
    setMessage("");
    try {
      const session = await refreshSession();
      if (session?.is_age_verified === true) {
        setVisible(false);
        setModalOpen(false);
        if (storageKey) window.sessionStorage.removeItem(storageKey);
      } else {
        setMessage(session
          ? "Todavía no figura verificada. Completá el proceso en la app y volvé a consultar."
          : "No pudimos consultar la sesión. Intentá de nuevo en unos instantes.");
      }
    } finally {
      setChecking(false);
    }
  };

  if (!visible || !user || isAgeVerified) return null;

  return (
    <>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Verificá tu identidad para comprar">
        <div className="purchase-verification__modal-content">
          <ShieldCheck aria-hidden="true" size={34} />
          <p>Para comprar, verificá tu DNI, rostro y mayoría de edad desde la aplicación de Sercio en tu teléfono. Ingresá con esta misma cuenta y abrí “Verificar identidad y edad”.</p>
          <p>Cuando termines, volvé a esta página y pulsá “Sí” en el aviso que quedará visible.</p>
          <button type="button" className="purchase-verification__modal-button" onClick={() => setModalOpen(false)}>
            Entendido
          </button>
        </div>
      </Modal>
      {!modalOpen && <aside className="purchase-verification" aria-live="polite">
        <div className="purchase-verification__heading">
          <ShieldCheck aria-hidden="true" size={22} />
          <strong>¿Verificaste la cuenta?</strong>
        </div>
        <p>Hacelo desde la app de Sercio en tu teléfono para poder comprar.</p>
        {message && <p className="purchase-verification__message">{message}</p>}
        <div className="purchase-verification__actions">
          <button type="button" className="purchase-verification__yes" onClick={checkVerification} disabled={checking}>
            {checking ? "Consultando..." : "Sí"}
          </button>
          <button type="button" className="purchase-verification__no" onClick={() => setModalOpen(true)} disabled={checking}>
            No
          </button>
        </div>
      </aside>}
    </>
  );
}
