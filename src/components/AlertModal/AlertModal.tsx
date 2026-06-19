"use client";
import { useEffect, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import "./AlertModal.css";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const defaultTitles: Record<AlertType, string> = {
  success: "¡Listo!",
  error: "Error",
  info: "Información",
  warning: "Atención",
};

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  showCancel = false,
}: AlertModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") {
        if (onConfirm) {
          onConfirm();
        }
        onClose();
      }
    },
    [onClose, onConfirm],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const IconComp = iconMap[type];
  const displayTitle = title || defaultTitles[type];

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div
        className="alert-modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
      >
        <div className={`alert-modal__icon-strip alert-modal__icon-strip--${type}`} />
        <div className="alert-modal__body">
          <div className={`alert-modal__icon-circle alert-modal__icon-circle--${type}`}>
            <IconComp size={28} />
          </div>
          <h3 className="alert-modal__title" id="alert-modal-title">
            {displayTitle}
          </h3>
          <p className="alert-modal__message" id="alert-modal-message">
            {message}
          </p>
        </div>
        <div className="alert-modal__footer">
          {showCancel && (
            <button
              className="alert-modal__btn alert-modal__btn--secondary"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button
            className="alert-modal__btn alert-modal__btn--primary"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
