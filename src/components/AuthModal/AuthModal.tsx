"use client";
import { useAuthModal } from "../../context/AuthModalContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import LoginPage from "../../views/Login/LoginPage";
import RegisterPage from "../../views/Register/RegisterPage";
import { X } from "lucide-react";
import "./AuthModal.css";

export default function AuthModal() {
  const { authMode, closeAuth, openAuth } = useAuthModal();
  const { user } = useAuth();

  // Registration closes after confirmation or plan selection.
  useEffect(() => {
    if (user && authMode === "login") {
      closeAuth();
    }
  }, [user, authMode, closeAuth]);


  // Close on Escape
  useEffect(() => {
    if (!authMode) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeAuth();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [authMode, closeAuth]);

  if (!authMode) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeAuth();
  };

  const switchMode = (mode) => openAuth(mode);

  return (
    <div className="auth-modal-backdrop" data-lock-page-scroll onClick={handleBackdropClick}>
      <div className={`auth-modal auth-modal--${authMode}`}>
        <button
          className="auth-modal__close"
          onClick={closeAuth}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
        <div className="auth-modal__content">
          {authMode === "login" ? (
            <LoginPage isModal onClose={closeAuth} onSwitchMode={switchMode} />
          ) : (
            <RegisterPage
              isModal
              onClose={closeAuth}
              onSwitchMode={switchMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
