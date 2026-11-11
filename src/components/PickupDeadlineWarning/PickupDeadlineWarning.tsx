import { AlertTriangle } from "lucide-react";
import "./PickupDeadlineWarning.css";

interface PickupDeadlineWarningProps {
  pickupReadyAt?: string | null;
}

export default function PickupDeadlineWarning({
  pickupReadyAt,
}: PickupDeadlineWarningProps) {
  const readyTime = pickupReadyAt ? Date.parse(pickupReadyAt) : NaN;
  const deadline = Number.isFinite(readyTime)
    ? new Date(readyTime + 30 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="pickup-deadline-warning" role="note">
      <AlertTriangle className="pickup-deadline-warning__icon" size={22} aria-hidden="true" />
      <div className="pickup-deadline-warning__content">
        <strong>Plazo de retiro: 30 días corridos</strong>
        <span>
          {deadline
            ? `Retirá tu compra antes del ${deadline.toLocaleString("es-AR", {
                dateStyle: "long",
                timeStyle: "short",
              })}. `
            : "El plazo comienza cuando el comercio marque el pedido como listo para retirar. "}
          Si no la retirás dentro del plazo, podés perder el dinero abonado.
        </span>
      </div>
    </div>
  );
}
