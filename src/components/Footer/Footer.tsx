"use client";
import { useState } from "react";
import BrandLogo from "../BrandLogo/BrandLogo";
import Modal from "../Modal/Modal";
import { Phone, Mail } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
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
          <button
            type="button"
            className="footer__link-btn"
            onClick={() => setIsTermsOpen(true)}
          >
            Términos y Condiciones
          </button>
          <button
            type="button"
            className="footer__link-btn"
            onClick={() => setIsSupportOpen(true)}
          >
            Soporte
          </button>
        </div>
      </div>

      {/* Términos y Condiciones Modal */}
      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Términos y Condiciones"
        maxWidth="600px"
      >
        <div className="footer-modal-content">
          <p className="footer-modal-content__intro">
            Bienvenido a Sercio. Al acceder y utilizar nuestra plataforma,
            aceptas cumplir y estar sujeto a los siguientes términos y
            condiciones de uso:
          </p>
          <div className="footer-modal-content__section">
            <h3>1. Descripción del Servicio</h3>
            <p>
              Sercio es una plataforma digital que facilita la búsqueda y
              conexión entre usuarios y profesionales, comercios locales o
              prestadores de servicios independientes. Sercio actúa únicamente
              como intermediario de información.
            </p>
          </div>
          <div className="footer-modal-content__section">
            <h3>2. Responsabilidad de los Servicios</h3>
            <p>
              La relación laboral, contractual o comercial que se establezca
              entre los usuarios y los prestadores de servicios es
              responsabilidad exclusiva de las partes. Sercio no garantiza la
              calidad, seguridad, puntualidad ni legalidad de los servicios
              contratados a través del sitio.
            </p>
          </div>
          <div className="footer-modal-content__section">
            <h3>3. Verificación de Cuentas (ARCA)</h3>
            <p>
              Aunque indicamos la verificación comercial de ciertas cuentas,
              esta se basa en la información provista por los organismos
              correspondientes y la proporcionada de buena fe por el comercio.
              Recomendamos a los usuarios realizar las validaciones necesarias
              antes de realizar transacciones.
            </p>
          </div>
          <div className="footer-modal-content__section">
            <h3>4. Uso de la Información y Propiedad Intelectual</h3>
            <p>
              Queda prohibido el uso no autorizado de los textos, imágenes,
              logos y datos personales contenidos en Sercio. Todo el material
              cargado por los usuarios debe respetar las leyes de derechos de
              autor vigentes.
            </p>
          </div>
        </div>
      </Modal>

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
