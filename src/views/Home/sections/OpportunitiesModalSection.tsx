"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2, Store, UserRound } from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import "./OpportunitiesModalSection.css";

const MOBILE_AUTO_OPEN_KEY = "opportunities_modal_mobile_seen_v1";

const PROFESSIONAL_ITEMS = [
  "Publicar tus servicios o productos y aparecer en búsquedas locales.",
  "Recibir consultas directas por chat y responder en tiempo real.",
  "Mostrar promociones, precios y horarios para atraer más clientes.",
  "Construir reputación con reseñas verificadas de usuarios reales.",
  "Destacar tu perfil comercial con contenido visual y videos.",
];

const USER_ITEMS = [
  "Encontrar profesionales y comercios por categoría y ubicación.",
  "Comparar perfiles, leer reseñas y elegir con confianza.",
  "Solicitar presupuestos, coordinar turnos y resolver todo por chat.",
  "Descubrir promociones y productos disponibles en tu provincia.",
  "Crea solicitudes de trabajo y recibe ofertas.",
];

export default function OpportunitiesModalSection() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenModal = localStorage.getItem(MOBILE_AUTO_OPEN_KEY);

    if (!hasSeenModal) {
      setIsOpen(true);
      localStorage.setItem(MOBILE_AUTO_OPEN_KEY, "true");
    }
  }, []);

  return (
    <section
      className="opportunities-modal-section"
      aria-labelledby="opportunities-modal-title"
    >
      <div className="home-section-container">
        <div className="opportunities-modal-section__card">
          <p className="opportunities-modal-section__eyebrow">
            Para profesionales y comercios
          </p>
          <h2
            className="opportunities-modal-section__title"
            id="opportunities-modal-title"
          >
            Creá tu cuenta gratis y potenciá tu negocio hoy
          </h2>
          <p className="opportunities-modal-section__subtitle">
            También te contamos todo lo que pueden hacer los usuarios para
            conectar con vos y contratar más rápido.
          </p>

          <button
            type="button"
            className="opportunities-modal-section__open-btn"
            onClick={() => setIsOpen(true)}
          >
            Ver guía completa
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Todo lo que podés hacer en Sercio"
        maxWidth="1000px"
      >
        <div className="opportunities-modal">
          <p className="opportunities-modal__intro">
            Si sos profesional o comercio, empezá creando tu cuenta gratis.
            Desde ahí podés activar tu perfil y convertir visitas en clientes.
          </p>

          <div className="opportunities-modal__scroll">
            <article className="opportunities-modal__panel opportunities-modal__panel--professional">
              <div className="opportunities-modal__panel-header">
                <Building2 size={20} />
                <h3>Profesionales y comercios</h3>
                <Store size={20} />
              </div>
              <ul className="opportunities-modal__list" role="list">
                {PROFESSIONAL_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="opportunities-modal__panel opportunities-modal__panel--users">
              <div className="opportunities-modal__panel-header">
                <UserRound size={20} />
                <h3>Usuarios</h3>
              </div>
              <ul className="opportunities-modal__list" role="list">
                {USER_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <button
            type="button"
            className="opportunities-modal__close-btn"
            onClick={() => setIsOpen(false)}
          >
            Cerrar guía
          </button>
        </div>
      </Modal>
    </section>
  );
}
