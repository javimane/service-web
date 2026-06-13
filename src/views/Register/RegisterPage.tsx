"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../routes/paths";
import { authService } from "../../services/authService";
import BrandLogo from "../../components/BrandLogo/BrandLogo";

import Modal from "../../components/Modal/Modal";
import { supabase } from "../../services/supabaseClient";
import { API_BASE_URL } from "../../services/api.config";
import RegisterPlanSelection from "./RegisterPlanSelection";
import { useAuth } from "../../context/AuthContext";
import "./RegisterPage.css";

type RegisterPageProps = {
  isModal?: boolean;
  onClose?: () => void;
  onSwitchMode?: (mode: string) => void;
};

export default function RegisterPage({
  isModal,
  onClose,
  onSwitchMode,
}: RegisterPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState<"normal" | "professional">("professional");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const { refreshSession } = useAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = "El nombre es requerido";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre es muy corto";
    }

    if (!formData.email) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "El formato del correo es inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "Debe tener al menos 6 caracteres";
    } else if (/\s/.test(formData.password)) {
      newErrors.password = "La contraseña no puede contener espacios";
    } else if (
      !/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(
        formData.password,
      )
    ) {
      newErrors.password =
        "Debe contener al menos una mayúscula, un número y un carácter especial";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme su contraseña";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setAuthError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setAuthError("");

    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
      });

      // Attempt to auto-login to create session
      try {
        const loginResp = await authService.login({
          email: formData.email,
          password: formData.password,
        });

        // if login succeeds and role is professional, show plan modal
        if (loginResp && role === "professional") {
          if (typeof window !== "undefined") {
            localStorage.setItem("show_plans_on_login", "true");
          }
          await refreshSession();
          setShowPlanModal(true);
          return; // Skip the normal success modal
        }
      } catch (e) {
        console.warn("Auto-login failed:", e);
      }

      setModalTitle("Registro exitoso");
      setModalMessage(
        "¡Cuenta creada exitosamente! Por favor revise su correo o inicie sesión.",
      );
      setModalOpen(true);
    } catch (err: any) {
      setAuthError(
        "Error inesperado al intentar crear la cuenta: " + err.message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setIsLoading(true);
    setAuthError("");
    try {
      window.location.href = `${API_BASE_URL}/api/auth/login/google?role=${role}`;
    } catch (err: any) {
      setAuthError(err.message || "Error al registrarse con Google.");
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (isModal) {
      onSwitchMode?.("login");
    } else {
      router.push(ROUTES.login);
    }
  };

  const formCard = (
    <div className="login-card register-card">
      <h2 className="login-title">Crear Cuenta</h2>
      <p className="login-subtitle">
        Complete los datos para registrarse en el panel.
      </p>

      <form
        className="login-form register-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div
          className="role-selector"
          style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}
        >
          <label
            className={`role-option ${role === "professional" ? "active" : ""}`}
            style={{
              flex: 1,
              padding: "1rem",
              border: `1px solid ${role === "professional" ? "var(--accent-color)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              textAlign: "center",
              background:
                role === "professional"
                  ? "var(--accent-transparent)"
                  : "var(--bg-card)",
            }}
          >
            <input
              type="radio"
              name="role"
              value="professional"
              checked={role === "professional"}
              onChange={() => setRole("professional")}
              style={{ display: "none" }}
            />
            <span
              style={{
                fontWeight: "var(--weight-bold)",
                color:
                  role === "professional"
                    ? "var(--accent-color)"
                    : "var(--text-secondary)",
              }}
            >
              Soy Profesional
            </span>
          </label>
          <label
            className={`role-option ${role === "normal" ? "active" : ""}`}
            style={{
              flex: 1,
              padding: "1rem",
              border: `1px solid ${role === "normal" ? "var(--accent-color)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              textAlign: "center",
              background:
                role === "normal"
                  ? "var(--accent-transparent)"
                  : "var(--bg-card)",
            }}
          >
            <input
              type="radio"
              name="role"
              value="normal"
              checked={role === "normal"}
              onChange={() => setRole("normal")}
              style={{ display: "none" }}
            />
            <span
              style={{
                fontWeight: "var(--weight-bold)",
                color:
                  role === "normal"
                    ? "var(--accent-color)"
                    : "var(--text-secondary)",
              }}
            >
              Busco Servicios
            </span>
          </label>
        </div>

        <div className="input-group">
          <label htmlFor="name">NOMBRE COMPLETO</label>
          <div className={`input-wrapper ${errors.name ? "has-error" : ""}`}>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
            />
            <span className="input-icon">👤</span>
          </div>
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="input-group">
          <label htmlFor="email">CORREO ELECTRÓNICO</label>
          <div className={`input-wrapper ${errors.email ? "has-error" : ""}`}>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="arquitecto@obsidian.pro"
            />
            <span className="input-icon">@</span>
          </div>
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-row">
          <div className="input-group">
            <label htmlFor="password">CONTRASEÑA</label>
            <div
              className={`input-wrapper ${errors.password ? "has-error" : ""}`}
            >
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "🔓" : "🔒"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">CONFIRMAR</label>
            <div
              className={`input-wrapper ${errors.confirmPassword ? "has-error" : ""}`}
            >
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showConfirmPassword ? "🔓" : "🔒"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        {authError && <div className="auth-error-alert">{authError}</div>}

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Registrarse"}
        </button>

        <div className="divider">
          <span>O CONTINUAR CON</span>
        </div>

        <div className="social-buttons">
          <button
            type="button"
            className="btn-social btn-social--register"
            onClick={handleGoogleRegister}
            disabled={isLoading}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        <p className="register-prompt">
          ¿Ya tienes una cuenta?{" "}
          {isModal ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => onSwitchMode?.("login")}
            >
              Ingresar
            </button>
          ) : (
            <Link href={ROUTES.login}>Ingresar</Link>
          )}
        </p>
      </form>

      <Modal
        isOpen={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={handleModalClose}
      />
    </div>
  );

  if (isModal) return formCard;

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="brand-content">
          <div className="brand-title">
            <BrandLogo className="brand-title__logo" />
          </div>
          <p className="brand-subtitle">
            Sumate a la nueva plataforma para descubrir profesionales,
            promociones y oportunidades cerca tuyo.
          </p>

          <div className="hero-graphic">
            <div className="hero-mesh"></div>
            <div className="status-pill status-pill--blue">
              <span className="status-dot status-dot--blue"></span>
              REGISTRATION: OPEN
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">{formCard}</div>

      <div className="footer-links">
        <span>© 2026 SERCIO. TU RED DE SERVICIOS Y COMERCIOS.</span>
        <div className="footer-right">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">SUPPORT</a>
        </div>
      </div>

      {showPlanModal && (
        <div className="subscription-confirm-overlay" style={{ zIndex: 1000, padding: "20px", overflowY: "auto", position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div style={{ position: "relative", maxWidth: "1000px", margin: "0 auto" }}>
            <RegisterPlanSelection />
          </div>
        </div>
      )}
    </div>
  );
}
