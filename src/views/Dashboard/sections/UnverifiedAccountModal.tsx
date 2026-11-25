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

  const handleGoCommercialData = () => {
    onClose();
    router.push(`${ROUTES.dashboard}?view=commercial-data&tab=company`);
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
        <h2 className="uav-modal__title">Verificá tus datos fiscales en ARCA</h2>
        <p className="uav-modal__body">
          Tu comercio tiene pendiente la validación fiscal en{" "}
          <strong>ARCA</strong>. Desde Datos comerciales podés verificar el CUIT/CUIL
          y la razón social de tu actividad comercial.
        </p>

        <ul className="uav-modal__benefits">
          <li>✓ Validación del CUIT/CUIL del comercio</li>
          <li>✓ Comprobación de la razón social</li>
          <li>✓ Consulta del estado fiscal en ARCA</li>
        </ul>

        {/* Actions */}
        <div className="uav-modal__actions">
          <button className="uav-modal__btn-primary" onClick={handleGoCommercialData}>
            Verificar datos en ARCA
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
