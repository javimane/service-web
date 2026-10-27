"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./ProfessionalRequirementsDialog.css";

type ProfessionalRequirementsDialogProps = {
  open: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export default function ProfessionalRequirementsDialog({
  open,
  onBack,
  onContinue,
}: ProfessionalRequirementsDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) setConfirmed(false);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="professional-requirements__overlay">
      <section
        className="professional-requirements__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="professional-requirements-title"
      >
        <h2
          id="professional-requirements-title"
          className="professional-requirements__title"
        >
          Requisitos para una cuenta profesional
        </h2>
        <p className="professional-requirements__intro">
          Para continuar necesitás tener una de estas condiciones fiscales activas:
        </p>
        <ul className="professional-requirements__list">
          <li>Monotributo activo</li>
          <li>Responsable inscripto</li>
          <li>Sociedad activa</li>
        </ul>
        <h3 className="professional-requirements__subtitle">CBU requerido</h3>
        <ul className="professional-requirements__list">
          <li>
            Monotributistas y responsables inscriptos: el CBU debe estar a nombre
            de la misma persona.
          </li>
          <li>
            Sociedades y empresas: el CBU debe estar a nombre de la misma empresa.
          </li>
        </ul>
        <p className="professional-requirements__warning">
          Si todavía no contás con estos datos, volvé y completalos antes de crear
          la cuenta profesional.
        </p>
        <label className="professional-requirements__confirmation">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>Confirmo que cuento con estos requisitos</span>
        </label>
        <div className="professional-requirements__actions">
          <button
            type="button"
            className="professional-requirements__back"
            onClick={onBack}
          >
            Volver
          </button>
          <button
            type="button"
            className="professional-requirements__continue"
            disabled={!confirmed}
            onClick={onContinue}
          >
            Continuar
          </button>
        </div>
      </section>
    </div>, document.body
  );
}
