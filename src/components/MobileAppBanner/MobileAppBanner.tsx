"use client";
import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import "./MobileAppBanner.css";

export default function MobileAppBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("mobile_app_banner_dismissed");
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("mobile_app_banner_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="mobile-app-banner">
      <button
        type="button"
        className="mobile-app-banner__close"
        onClick={handleDismiss}
        aria-label="Cerrar aviso"
      >
        <X size={16} />
      </button>

      <div className="mobile-app-banner__content">
        <div className="mobile-app-banner__header">
          <div className="mobile-app-banner__icon-box">
            <Smartphone size={22} />
          </div>
          <div className="mobile-app-banner__info">
            <span className="mobile-app-banner__title">
              ¡Descargá la App de Sercio!
            </span>
            <p className="mobile-app-banner__desc">
              Accedé a más servicios y comercios directo en tu celular.
            </p>
          </div>
        </div>

        <div className="mobile-app-banner__actions">
          <a
            href="https://play.google.com/store/apps/details?id=com.sercio.sercio"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-app-banner__btn mobile-app-banner__btn--play"
          >
            <svg
              className="mobile-app-banner__btn-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.609 1.814L13.792 12 3.61 22.186a1.98 1.98 0 0 1-.61-1.428V3.242c0-.555.228-1.057.609-1.428zm11.597 8.772l2.946-2.946-13.064-7.53 10.118 10.476zm0 2.828L5.088 23.89l13.064-7.53-2.946-2.946zm1.414-1.414l3.582 2.067a1.98 1.98 0 0 0 0-3.434l-3.582-2.067-2.732 2.732 2.732 2.702z" />
            </svg>
            <span>Google Play</span>
          </a>

          <a
            href="https://apps.apple.com/us/app/sercio/id6787519258"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-app-banner__btn mobile-app-banner__btn--apple"
          >
            <svg
              className="mobile-app-banner__btn-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1 .04-2.2.67-2.91 1.49-.63.73-1.18 1.91-1.03 3.03 1.12.09 2.28-.57 2.95-1.4" />
            </svg>
            <span>App Store</span>
          </a>
        </div>
      </div>
    </div>
  );
}
