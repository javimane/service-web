"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../routes/paths";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { supabase } from "../../services/supabaseClient";
import "./LoginPage.css";

type LoginPageProps = {
  isModal?: boolean;
  onClose?: () => void;
  onSwitchMode?: (mode: string) => void;
};

export default function LoginPage({
  isModal,
  onClose,
  onSwitchMode,
}: LoginPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const { refreshSession, setSessionStatus } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
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
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error al escribir
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
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      // Sincronizar login con la base de datos de Chat (Supabase)
      const { error: chatLoginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (chatLoginError) {
        console.error("Error al iniciar sesión en el chat:", chatLoginError.message);
        // Opcional: Decidir si el login general falla si el chat falla.
      }

      if (response?.sessionStatus) {
        setSessionStatus(response.sessionStatus);
      }

      await refreshSession();

      if (isModal) {
        onClose?.();
      } else {
        router.push(ROUTES.home);
      }
    } catch (err: any) {
      setAuthError(
        err.message || "Error inesperado al intentar iniciar sesión",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formCard = (
    <div className="login-card">
      <h2 className="login-title">Bienvenido</h2>
      <p className="login-subtitle">
        Ingrese sus credenciales para acceder al panel.
      </p>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
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

        <div className="input-group">
          <div className="label-row">
            <label htmlFor="password">CONTRASEÑA</label>
            <a href="#" className="forgot-password">
              ¿OLVIDÓ SU CONTRASEÑA?
            </a>
          </div>
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

        {authError && <div className="auth-error-alert">{authError}</div>}

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Ingresando..." : "Ingresar"}
        </button>

        <div className="divider">
          <span>O CONTINUAR CON</span>
        </div>

        <div className="social-buttons">
          <button type="button" className="btn-social">
            G Google
          </button>
        </div>

        <p className="register-prompt">
          ¿No tienes una cuenta?{" "}
          {isModal ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => onSwitchMode?.("register")}
            >
              Crear cuenta
            </button>
          ) : (
            <Link href={ROUTES.register}>Crear cuenta</Link>
          )}
        </p>
      </form>
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
            Encontrá servicios, promociones y productos cerca tuyo desde una
            sola plataforma.
          </p>

          <div className="hero-graphic">
            <div className="hero-mesh"></div>
            <div className="status-pill">
              <span className="status-dot"></span>
              STATUS: ACTIVE
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
    </div>
  );
}
