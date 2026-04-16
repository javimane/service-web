import { useAuthModal } from "../../context/AuthModalContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import LoginPage from "../../pages/Login/LoginPage";
import RegisterPage from "../../pages/Register/RegisterPage";
import { X } from "lucide-react";
import "./AuthModal.css";

export default function AuthModal() {
  const { authMode, closeAuth, openAuth } = useAuthModal();
  const { user } = useAuth();

  // Auto-close modal when user logs in
  useEffect(() => {
    if (user && authMode) {
      closeAuth();
    }
  }, [user, authMode, closeAuth]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (authMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [authMode]);

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
    <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
      <div className="auth-modal">
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
