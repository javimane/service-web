"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "../BrandLogo/BrandLogo";
import Modal from "../Modal/Modal";
import { Phone, Mail, Loader2 } from "lucide-react";
import { ROUTES } from "../../routes/paths";
import { userService } from "../../services/userService";
import "./Footer.css";

export default function Footer() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [mobilePhone, setMobilePhone] = useState<string | null>(null);

  useEffect(() => {
    if (isSupportOpen && !mobilePhone) {
      userService
        .getMobilePhone()
        .then((res) => {
          if (res && res.mobilePhone) {
            setMobilePhone(res.mobilePhone);
          }
        })
        .catch((err) => console.error("Error fetching mobile phone:", err));
    }
  }, [isSupportOpen, mobilePhone]);

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__brand-logo">
            <BrandLogo className="footer__brand-mark" />
          </div>
          <p className="footer__copy">
            © 2026 Sercio. Tu red de servicios y comercios en un solo lugar.
          </p>
        </div>

        <div className="footer__apps">
          <span className="footer__apps-title">Descargá nuestra App</span>
          <div className="footer__apps-buttons">
            <a
              href="https://play.google.com/store/apps/details?id=com.sercio.sercio"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__app-btn"
            >
              <svg
                className="footer__app-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.98 1.98 0 0 1-.61-1.428V3.242c0-.555.228-1.057.609-1.428zm11.597 8.772l2.946-2.946-13.064-7.53 10.118 10.476zm0 2.828L5.088 23.89l13.064-7.53-2.946-2.946zm1.414-1.414l3.582 2.067a1.98 1.98 0 0 0 0-3.434l-3.582-2.067-2.732 2.732 2.732 2.702z" />
              </svg>
              <div className="footer__app-text">
                <span className="footer__app-subtitle">DISPONIBLE EN</span>
                <span className="footer__app-title">Google Play</span>
              </div>
            </a>

            <a
              href="https://apps.apple.com/us/app/sercio/id6787519258"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__app-btn"
            >
              <svg
                className="footer__app-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1 .04-2.2.67-2.91 1.49-.63.73-1.18 1.91-1.03 3.03 1.12.09 2.28-.57 2.95-1.4" />
              </svg>
              <div className="footer__app-text">
                <span className="footer__app-subtitle">CONSÍGUELO EN EL</span>
                <span className="footer__app-title">App Store</span>
              </div>
            </a>
          </div>
        </div>

        <div className="footer__socials">
          <span className="footer__socials-title">Seguinos</span>
          <div className="footer__socials-list">
            <a
              href="https://www.facebook.com/profile.php?id=61591535649020"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__social-link"
              aria-label="Facebook"
            >
              <img
                src="/facebook (1).png"
                alt=""
                className="footer__social-icon"
                loading="lazy"
              />
              <span>Facebook</span>
            </a>
            <a
              href="https://www.instagram.com/sercio.web"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__social-link"
              aria-label="Instagram"
            >
              <img
                src="/instagram.png"
                alt=""
                className="footer__social-icon"
                loading="lazy"
              />
              <span>Instagram</span>
            </a>
          </div>
        </div>

        <div className="footer__links">
          <Link href={ROUTES.faq} className="footer__link-btn">
            Preguntas Frecuentes
          </Link>
          <Link href={ROUTES.terms} className="footer__link-btn">
            Términos y Condiciones
          </Link>
          <Link href={ROUTES.privacy} className="footer__link-btn">
            Privacidad
          </Link>
          <button
            type="button"
            className="footer__link-btn"
            onClick={() => setIsSupportOpen(true)}
          >
            Soporte
          </button>
        </div>
      </div>

      {/* Soporte Modal */}
      <Modal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        title="Centro de Soporte"
        maxWidth="450px"
      >
        <div className="footer-modal-content">
          <p className="footer-modal-content__intro">
            ¿Necesitás ayuda con tu cuenta, servicios o alguna consulta técnica?
            Elegí un medio de contacto para comunicarte con nuestro equipo:
          </p>

          <div className="support-channels">
            <a
              href={
                mobilePhone
                  ? `https://wa.me/${mobilePhone.replace(/\D/g, "")}?text=Hola,%20necesito%20soporte%20en%20Sercio`
                  : "#"
              }
              target={mobilePhone ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="support-channel support-channel--whatsapp"
              onClick={(e) => {
                if (!mobilePhone) {
                  e.preventDefault();
                }
              }}
            >
              <div className="support-channel__icon">
                {mobilePhone ? (
                  <Phone size={20} />
                ) : (
                  <Loader2 size={20} className="animate-spin" />
                )}
              </div>
              <div className="support-channel__details">
                <span className="support-channel__label">WhatsApp</span>
                <span className="support-channel__value">
                  {mobilePhone || "Cargando..."}
                </span>
              </div>
            </a>

            <a
              href="mailto:soporte@sercio.com?subject=Soporte%20Sercio"
              className="support-channel support-channel--email"
            >
              <div className="support-channel__icon">
                <Mail size={20} />
              </div>
              <div className="support-channel__details">
                <span className="support-channel__label">
                  Correo Electrónico
                </span>
                <span className="support-channel__value">
                  soporte@sercio.com
                </span>
              </div>
            </a>
          </div>
        </div>
      </Modal>
    </footer>
  );
}
