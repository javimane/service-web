"use client";
import { useState } from "react";
import Link from "next/link";
import BrandLogo from "../BrandLogo/BrandLogo";
import Modal from "../Modal/Modal";
import { Phone, Mail } from "lucide-react";
import { ROUTES } from "../../routes/paths";
import "./Footer.css";

export default function Footer() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

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

        <div className="footer__links">
          <Link href={ROUTES.terms} className="footer__link-btn">
            Términos y Condiciones
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
              href="https://wa.me/5491123456789?text=Hola,%20necesito%20soporte%20en%20Sercio"
              target="_blank"
              rel="noopener noreferrer"
              className="support-channel support-channel--whatsapp"
            >
              <div className="support-channel__icon">
                <Phone size={20} />
              </div>
              <div className="support-channel__details">
                <span className="support-channel__label">WhatsApp</span>
                <span className="support-channel__value">
                  +54 9 11 2345-6789
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
