import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  User,
  Ticket,
  CheckCircle,
} from "lucide-react";
import { promotions } from "../../../data/promotions";
import PromotionCard from "../../../components/Cards/PromotionCard";
import Modal from "../../../components/Modal/Modal";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./PromotionsSection.css";

export default function PromotionsSection() {
  const [selectedPromo, setSelectedPromo] = useState(null);
  const sliderRef = useRef(null);
  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".promotion-card");

  const handlePromoClick = (promo) => {
    setSelectedPromo(promo);
  };

  const handleDownload = (promo) => {
    alert(
      `Descargando cupón para ${promo.title}...\n(Enriqueciendo experiencia de usuario)`,
    );
  };

  return (
    <section className="promotions-section">
      <div className="promotions-section__header">
        <div>
          <span className="section-label">Oportunidades</span>
          <h2 className="promotions-section__title">Promociones Imperdibles</h2>
        </div>
        <button className="section-link">Ver todo</button>
      </div>

      <div className="promotions-section__carousel">
        <button
          className={`carousel-control carousel-control--left ${showLeftArrow ? "" : "carousel-control--hidden"}`}
          type="button"
          onClick={() => scrollCarousel(-1)}
          aria-label="Anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={sliderRef}
          className="promotions-section__scroll"
          onScroll={updateArrowVisibility}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {promotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              promotion={promo}
              onClick={handlePromoClick}
            />
          ))}
        </div>

        <button
          className={`carousel-control carousel-control--right ${showRightArrow ? "" : "carousel-control--hidden"}`}
          type="button"
          onClick={() => scrollCarousel(1)}
          aria-label="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <Modal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        title="Detalle de Promoción"
      >
        {selectedPromo && (
          <div className="promo-modal">
            <div className="promo-modal__coupon">
              <div className="promo-modal__top-banner">
                <Ticket className="promo-modal__ticket-icon" size={32} />
                <span className="promo-modal__offer-badge">
                  {selectedPromo.offer}
                </span>
              </div>

              <div className="promo-modal__image-wrapper">
                <img
                  src={selectedPromo.image}
                  alt={selectedPromo.title}
                  className="promo-modal__image"
                />
              </div>

              <div className="promo-modal__body">
                <h3 className="promo-modal__title">{selectedPromo.title}</h3>
                <p className="promo-modal__description">
                  {selectedPromo.description}
                </p>

                <div className="promo-modal__details">
                  <div className="promo-modal__detail-item">
                    <User size={16} />
                    <span>
                      <strong>Profesional:</strong>{" "}
                      {selectedPromo.professionalName}
                    </span>
                  </div>
                  <div className="promo-modal__detail-item">
                    <Calendar size={16} />
                    <span>
                      <strong>Validez:</strong> {selectedPromo.validFrom} al{" "}
                      {selectedPromo.validTo}
                    </span>
                  </div>
                </div>

                <div className="promo-modal__code-box">
                  <span className="promo-modal__code-label">
                    CÓDIGO DE VERIFICACIÓN
                  </span>
                  <div className="promo-modal__code-value">
                    {selectedPromo.verificationCode}
                  </div>
                </div>

                <button
                  className="promo-modal__download-btn"
                  type="button"
                  onClick={() => handleDownload(selectedPromo)}
                >
                  <Download size={20} />
                  Descargar Cupón
                </button>

                <p className="promo-modal__footer-text">
                  <CheckCircle size={12} /> Presenta este cupón al momento del
                  servicio
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
