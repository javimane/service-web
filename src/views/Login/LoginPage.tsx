"use client";
import { useState, useEffect } from "react";
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
  const { refreshSession, setSessionStatus, sessionStatus, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Handling Supabase OAuth redirects (e.g. from Google login)
    if (user && sessionStatus) {
      let isNewUser = false;
      const createdAt = sessionStatus.user_created_at ? new Date(sessionStatus.user_created_at).getTime() : 0;
      const lastSignIn = sessionStatus.user_last_sign_in_at ? new Date(sessionStatus.user_last_sign_in_at).getTime() : createdAt;
      
      if (createdAt > 0 && Math.abs(lastSignIn - createdAt) < 5 * 60 * 1000) {
        isNewUser = true;
      }
      
      const isProf = !!sessionStatus.is_professional;

      if (isModal) {
        onClose?.();
        if (isNewUser && isProf) router.push(ROUTES.dashboard);
      } else {
        if (isNewUser && isProf) router.push(ROUTES.dashboard);
        else router.push(ROUTES.home);
      }
    }
  }, [user, sessionStatus, isModal, onClose, router]);

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
        console.error(
          "Error al iniciar sesión en el chat:",
          chatLoginError.message,
        );
        // Opcional: Decidir si el login general falla si el chat falla.
      }

      let isNewUser = false;
      let isProf = false;
      if (response?.sessionStatus) {
        setSessionStatus(response.sessionStatus);
        const st = response.sessionStatus;
        if (st.user_created_at && st.user_last_sign_in_at) {
          const created = new Date(st.user_created_at).getTime();
          const lastSignIn = new Date(st.user_last_sign_in_at).getTime();
          if (Math.abs(lastSignIn - created) < 5 * 60 * 1000) {
            isNewUser = true;
          }
        }
        isProf = !!st.is_professional;
      }

      await refreshSession();

      if (isModal) {
        onClose?.();
      } else {
        if (isNewUser && isProf) {
          router.push(ROUTES.dashboard);
        } else {
          router.push(ROUTES.home);
        }
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

        <div
          className="social-buttons"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <button
            type="button"
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", width: "100%", justifyContent: "center" }}
            onClick={() => {
              const redirectTo = encodeURIComponent(window.location.origin + '/dashboard?auth=success');
              window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/login/google?redirectTo=${redirectTo}`;
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
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
