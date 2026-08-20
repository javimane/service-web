"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import "./UnverifiedAccountModal.css";
import { ROUTES } from "@/routes/paths";

interface UnverifiedAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnverifiedAccountModal({
  isOpen,
  onClose,
}: UnverifiedAccountModalProps) {
  const router = useRouter();

  const handleGoSettings = () => {
    onClose();
    router.push(ROUTES.settings);
  };

  if (!isOpen) return null;

  return (
    <div className="uav-modal-overlay">
      <div className="uav-modal" role="dialog" aria-modal="true">
        {/* Close button */}
        <button
          className="uav-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="uav-modal__icon-wrap">
          <ShieldCheck size={36} className="uav-modal__icon" />
        </div>

        {/* Content */}
        <h2 className="uav-modal__title">¡Verificá tu cuenta!</h2>
        <p className="uav-modal__body">
          Tu perfil aún no está verificado. Los perfiles verificados generan{" "}
          <strong>mayor confianza</strong> en los clientes, aparecen destacados
          en los resultados de búsqueda y aumentan tus chances de ser
          contratado.
        </p>

        <ul className="uav-modal__benefits">
          <li>✓ Distintivo de cuenta verificada visible en tu perfil</li>
          <li>✓ Mayor credibilidad ante tus clientes</li>
          <li>✓ Mejor posicionamiento en búsquedas</li>
        </ul>

        {/* Actions */}
        <div className="uav-modal__actions">
          <button className="uav-modal__btn-primary" onClick={handleGoSettings}>
            Verificar ahora
            <ArrowRight size={16} />
          </button>
          <button className="uav-modal__btn-secondary" onClick={onClose}>
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
