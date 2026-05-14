"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, Home, LogIn } from "lucide-react";
import "./SessionTimeoutOverlay.css";

export default function SessionTimeoutOverlay() {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleExpired = () => {
      setVisible(true);
      // Optional: Clear tokens here if not done in apiClient
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    };

    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  useEffect(() => {
    let timer: any;
    if (visible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (visible && countdown === 0) {
      window.location.href = "/";
    }
    return () => clearInterval(timer);
  }, [visible, countdown]);

  if (!visible) return null;

  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-card">
        <div className="session-timeout-icon">
          <AlertTriangle size={32} />
        </div>
        <div className="session-timeout-content">
          <h3>Sesión Agotada</h3>
          <p>
            Tu sesión ha expirado por inactividad o seguridad. Serás redirigido
            a la pantalla de inicio en <strong>{countdown} segundos</strong>.
          </p>
        </div>
        <div className="session-timeout-actions">
          <button 
            className="session-timeout-btn"
            onClick={() => window.location.href = "/"}
          >
            <Home size={18} />
            Ir ahora
          </button>
        </div>
      </div>
    </div>
  );
}
