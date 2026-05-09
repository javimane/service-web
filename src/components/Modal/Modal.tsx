import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import "./Modal.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  children?: ReactNode;
  noPadding?: boolean;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  children,
  noPadding = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        )}
        <div className={`modal-content ${noPadding ? "no-padding" : ""}`}>
          {message ? <p>{message}</p> : children}
        </div>
      </div>
    </div>
  );
}
