"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import AlertModal, { type AlertType } from "../components/AlertModal/AlertModal";

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

interface AlertContextValue {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState(options);
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      showAlert({ message, title, type: "success" });
    },
    [showAlert],
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      showAlert({ message, title, type: "error" });
    },
    [showAlert],
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      showAlert({ message, title, type: "info" });
    },
    [showAlert],
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      showAlert({ message, title, type: "warning" });
    },
    [showAlert],
  );

  const handleClose = useCallback(() => {
    setAlertState(null);
  }, []);

  return (
    <AlertContext.Provider
      value={{ showAlert, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      <AlertModal
        isOpen={!!alertState}
        onClose={handleClose}
        message={alertState?.message || ""}
        title={alertState?.title}
        type={alertState?.type || "info"}
        confirmText={alertState?.confirmText}
        cancelText={alertState?.cancelText}
        onConfirm={alertState?.onConfirm}
        showCancel={alertState?.showCancel}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert debe usarse dentro de AlertProvider");
  return ctx;
}
