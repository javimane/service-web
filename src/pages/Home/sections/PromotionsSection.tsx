import { useRef, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes/paths";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  User,
  Ticket,
  CheckCircle,
  MapPin,
  Loader2,
  X,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { professionalPromotionService } from "../../../services/professionalPromotionService";
import { locationService } from "../../../services/locationService";
import { useAuth } from "../../../context/AuthContext";
import PromotionCard from "../../../components/Cards/PromotionCard";
import Modal from "../../../components/Modal/Modal";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import { toJpeg } from "html-to-image";
import "./PromotionsSection.css";

export default function PromotionsSection() {
  const navigate = useNavigate();
  const { sessionStatus } = useAuth();
  const [userProvince, setUserProvince] = useState<string>(localStorage.getItem("userProvince") || "Buenos Aires");
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const couponRef = useRef<HTMLDivElement>(null);
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

  // Fetch Provinces for the selector
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: () => locationService.getProvinces(),
  });

  // Fetch Promotions based on province
  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ["promotions", userProvince],
    queryFn: () => professionalPromotionService.getAll({ province: userProvince }),
    enabled: true,
  });

  // Auto-detect province if authenticated and not set
  useEffect(() => {
    if (sessionStatus?.address?.Province?.name && !localStorage.getItem("userProvince")) {
      setUserProvince(sessionStatus.address.Province.name);
    }
  }, [sessionStatus]);

  const promosList = useMemo(() => {
    if (!promotionsData) return [];
    return promotionsData.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      offer: p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : 
             p.discount_type === 'fixed' ? `$${p.discount_value} OFF` :
             p.discount_type === 'bogo' ? '2x1' : 'GRATIS',
      professionalName: p.Professional?.Company?.name || "Profesional",
      validFrom: p.from_date ? new Date(p.from_date).toLocaleDateString() : 'N/A',
      validTo: p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Indefinido',
      image: p.image_url || "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
      verificationCode: `PROMO-${p.id.toString().slice(0, 4).toUpperCase()}`,
      professionalId: p.professional_id || p.Professional?.id,
      _original: p
    }));
  }, [promotionsData]);

  const handlePromoClick = (promo) => {
    setSelectedPromo(promo);
  };

  const handleDownload = async (promo: any) => {
    if (!couponRef.current) return;
    try {
      const dataUrl = await toJpeg(couponRef.current, {
        quality: 0.95,
        backgroundColor: "#fff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `cupon-${promo.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error downloading coupon:", err);
      alert("No se pudo descargar el cupón en este momento.");
    }
  };

  const handleProvinceSelect = (provinceName: string) => {
    setUserProvince(provinceName);
    localStorage.setItem("userProvince", provinceName);
    setIsProvinceModalOpen(false);
  };

  return (
    <section className="promotions-section">
      <div className="promotions-section__header">
        <div className="promotions-section__title-group">
          <h2 className="promotions-section__title">Promociones Imperdibles</h2>
          <button 
            className="promotions-section__location-btn"
            onClick={() => setIsProvinceModalOpen(true)}
          >
            <MapPin size={14} />
            {userProvince}
          </button>
        </div>
        <button className="section-link">Ver todo &gt;</button>
      </div>

      <div className="promotions-section__carousel">
        {isLoading ? (
          <div className="promotions-section__loading">
            <Loader2 className="animate-spin" size={32} />
            <p>Buscando las mejores ofertas para ti...</p>
          </div>
        ) : promosList.length === 0 ? (
          <div className="promotions-section__empty">
            <Sparkles size={48} className="empty-icon" />
            <h3>¡Vaya! No hay promos en {userProvince}</h3>
            <p>Intenta cambiar de provincia para descubrir más oportunidades.</p>
            <button className="change-loc-btn" onClick={() => setIsProvinceModalOpen(true)}>
              Cambiar Ubicación
            </button>
          </div>
        ) : (
          <>
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
              {promosList.map((promo) => (
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
          </>
        )}
      </div>

      <Modal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        noPadding
      >
        {selectedPromo && (
          <div className="promo-modal">
            <div className="promo-modal__coupon" ref={couponRef}>
              <button className="promo-modal__close-btn" onClick={() => setSelectedPromo(null)}>
                <X size={20} />
              </button>
              <div className="promo-modal__top-banner">
                <div 
                  className="promo-modal__professional-mini" 
                  onClick={() => {
                    navigate(`${ROUTES.profile}/${selectedPromo.professionalId}`);
                    setSelectedPromo(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="avatar-placeholder">
                    <Sparkles size={16} />
                  </div>
                  <div className="prof-info">
                    <span className="prof-name">{selectedPromo.professionalName}</span>
                    <span className="prof-label">PROFESIONAL VERIFICADO</span>
                  </div>
                </div>
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
                    <Calendar size={16} />
                    <span>
                      <strong>Validez:</strong> {selectedPromo.validFrom} al{" "}
                      {selectedPromo.validTo}
                    </span>
                  </div>
                  <div className="promo-modal__detail-item">
                    <MapPin size={16} />
                    <span>
                      <strong>Ubicación:</strong> {userProvince}
                    </span>
                  </div>
                </div>

                <button
                  className="promo-modal__download-btn"
                  type="button"
                  onClick={() => handleDownload(selectedPromo)}
                >
                  <Download size={20} />
                  Descargar Cupón JPG
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

      {/* Province Selector Modal */}
      <Modal
        isOpen={isProvinceModalOpen}
        onClose={() => setIsProvinceModalOpen(false)}
        title="Seleccionar Ubicación"
      >
        <div className="province-selector">
          <p className="province-selector__hint">
            Mostraremos las promociones disponibles en la provincia que elijas.
          </p>
          <div className="province-selector__grid">
            {provinces.map((prov) => (
              <button
                key={prov.id}
                className={`province-chip ${userProvince === prov.name ? "active" : ""}`}
                onClick={() => handleProvinceSelect(prov.name)}
              >
                {prov.name}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}
