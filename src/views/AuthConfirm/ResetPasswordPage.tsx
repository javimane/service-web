"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { ROUTES } from "../../routes/paths";
import Link from "next/link";
import "../../views/Login/LoginPage.css"; // Reutilizamos los estilos del Login

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const { refreshSession } = useAuth();

  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState("");

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!tokenHash || !type) {
      setVerifyError("Faltan parámetros de recuperación en el enlace.");
      setIsVerifying(false);
      return;
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyToken = async () => {
      try {
        await authService.verifyOtp({ token_hash: tokenHash, type });
        await refreshSession(); // Cargar la sesión fresca
        setIsVerifying(false);
      } catch (err: any) {
        setVerifyError(err.message || "El enlace de recuperación es inválido o ha expirado.");
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [tokenHash, type, refreshSession]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      await authService.updatePassword(formData.password);
      setSubmitSuccess(true);
      
      // Esperar para que lea el mensaje de éxito antes de redirigir
      setTimeout(() => {
        router.push(ROUTES.dashboard);
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || "Ocurrió un error al actualizar la contraseña.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="brand-content">
          <div className="brand-title">
            <BrandLogo />
          </div>
          <p className="brand-subtitle">
            Plataforma integral para profesionales de la construcción y diseño.
          </p>
          <div className="hero-graphic">
            <div className="hero-mesh"></div>
            <div className="status-pill">
              <div className="status-dot"></div>
              Sistemas Operativos
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        {isVerifying ? (
          <div className="login-card">
            <h2 className="login-title">Verificando...</h2>
            <p className="login-subtitle">Aguarde un momento mientras validamos su solicitud segura.</p>
          </div>
        ) : verifyError ? (
          <div className="login-card">
            <h2 className="login-title">Enlace Inválido</h2>
            <p className="login-subtitle" style={{ color: "var(--error-color)" }}>{verifyError}</p>
            <Link href={ROUTES.login} className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: "1rem" }}>
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <div className="login-card">
            <h2 className="login-title">Nueva Contraseña</h2>
            <p className="login-subtitle">
              Ingrese su nueva contraseña de acceso seguro.
            </p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="input-group">
                <label htmlFor="password">NUEVA CONTRASEÑA</label>
                <div className={`input-wrapper ${errors.password ? "has-error" : ""}`}>
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
                  >
                    {showPassword ? "🔓" : "🔒"}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">CONFIRMAR CONTRASEÑA</label>
                <div className={`input-wrapper ${errors.confirmPassword ? "has-error" : ""}`}>
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
                  >
                    {showConfirmPassword ? "🔓" : "🔒"}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              {submitError && <div className="auth-error-alert">{submitError}</div>}
              {submitSuccess && (
                <div className="auth-error-alert" style={{ background: 'rgba(64, 192, 87, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' }}>
                  Contraseña actualizada con éxito. Redirigiendo al panel...
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={isSubmitting || submitSuccess}>
                {isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
