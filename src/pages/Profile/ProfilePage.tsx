import { useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, MessageCircle, Phone, ArrowUpRight, Loader2, Play, Heart, Eye, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "../../routes/paths";
import { professionalService } from "../../services/professionalService";
import { serviceService } from "../../services/serviceService";
import { professionalImagesService } from "../../services/professionalImagesService";
import { videosService } from "../../services/videosService";
import { reelsService } from "../../services/reelsService";
import { reviewService } from "../../services/reviewService";
import { professionalPromotionService } from "../../services/professionalPromotionService";
import { bankPromotionService } from "../../services/bankPromotionService";
import { productService } from "../../services/productService";
import TestimonialCard from "./sections/TestimonialCard";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Modal from "../../components/Modal/Modal";
import PaymentMethodsCard from "../../components/Cards/PaymentMethodsCard";
import BankPromosCard from "../../components/Cards/BankPromosCard";
import "./ProfilePage.css";
import ProductCard from "../../components/Cards/ProductCard";
import PromotionDetailModal from "../../components/Modals/PromotionDetailModal";
import ServiceDetailModal from "../Services/ServiceDetailModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Custom hook for drag-to-scroll
function useDraggableScroll() {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    isDragging,
    events: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
    },
  };
}

function ProfileVideoCard({ video, onSelect }: { video: any, onSelect: (v: any) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="instagram-video-card">
      <div 
        className="video-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onSelect(video)}
        style={{ cursor: 'pointer' }}
      >
        <video
          ref={videoRef}
          src={video.video_url}
          className="video-element"
          poster={video.thumbnail_url}
          playsInline
          loop
          muted
        />
        <div className="video-stats-overlay">
          <div className="stat">
            <Heart size={14} fill="white" />
            <span>{video.likes_count || 0}</span>
          </div>
          <div className="stat">
            <Eye size={14} fill="white" />
            <span>{video.views_count || 0}</span>
          </div>
        </div>
        <div className="play-hint-overlay">
          <Play size={32} fill="white" />
        </div>
      </div>
      
      <div className="video-content">
        <h3 className="video-title">{video.title}</h3>
        
        <button 
          className="description-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Descripción</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className={`video-description ${isExpanded ? "is-expanded" : ""}`}>
          <p>{video.description || "Sin descripción disponible."}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isBankPromosModalOpen, setIsBankPromosModalOpen] = useState(false);
  const [isPromosModalOpen, setIsPromosModalOpen] = useState(false);
  const [selectedPromoForDetail, setSelectedPromoForDetail] = useState<any>(null);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<any>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<any>(null);
  const [selectedReel, setSelectedReel] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const servicesScroll = useDraggableScroll();
  const videosScroll = useDraggableScroll();
  const productsScroll = useDraggableScroll();

  const scrollContainer = (ref: any, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const { data: professional, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["professional-detail", id],
    queryFn: () => professionalService.getDetail(id),
    enabled: !!id
  });

  const { data: services = [] } = useQuery({
    queryKey: ["professional-services", id],
    queryFn: () => serviceService.getByProfessional(id),
    enabled: !!id
  });

  const { data: images = [] } = useQuery({
    queryKey: ["professional-images", id],
    queryFn: () => professionalImagesService.findAllByProfessionalId(Number(id)),
    enabled: !!id
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["professional-videos", id],
    queryFn: () => videosService.findByProfessionalId(Number(id)),
    enabled: !!id
  });

  const { data: allReels = [] } = useQuery({
    queryKey: ["all-reels"],
    queryFn: () => reelsService.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["professional-reviews", id],
    queryFn: () => reviewService.findByProfessionalId(id!),
    enabled: !!id
  });

  const { data: profPromotions = [] } = useQuery({
    queryKey: ["professional-promotions", id],
    queryFn: () => professionalPromotionService.getByProfessional(id!),
    enabled: !!id
  });

  const { data: allBankPromos = [] } = useQuery({
    queryKey: ["all-bank-promotions"],
    queryFn: () => bankPromotionService.getAll(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["professional-products", id],
    queryFn: () => productService.getByProfessional(Number(id)),
    enabled: !!id
  });

  const profBankPromos = useMemo(() => {
    return allBankPromos.filter(bp => bp.Professional?.id === Number(id));
  }, [allBankPromos, id]);

  const getBankNames = (promo: any) => {
    const relationNames = (promo.bank_promotions_banks || [])
      .map((r: any) => r.Bank?.name)
      .filter(Boolean);
    if (relationNames.length > 0) return Array.from(new Set(relationNames));
    if (promo.Bank?.name) return [promo.Bank.name];
    return ["Banco"];
  };

  const profReels = useMemo(() => {
    return allReels.filter(r => r.professional_id === Number(id));
  }, [allReels, id]);

  const profile = professional?.Profile;
  const company = professional?.Companies?.[0] || professional?.Company;
  const name = company?.name || profile?.display_name || "Profesional";
  const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  const isVerified = company?.companies_arca?.[0]?.is_verified || professional?.is_verified;
  const hasReels = profReels.length > 0;

  const paymentMethods = useMemo(() => {
    if (!company) return [];
    const methods = [];
    if (company.cash) methods.push({ id: 'cash', type: 'cash', label: 'Efectivo' });
    if (company.credit) methods.push({ id: 'credit', type: 'credit', label: 'Crédito' });
    if (company.debit) methods.push({ id: 'debit', type: 'credit', label: 'Débito' });
    if (company.transfer) methods.push({ id: 'transfer', type: 'bank', label: 'Transferencia' });
    if (company.cheque) methods.push({ id: 'cheque', type: 'bank', label: 'Cheque' });
    return methods;
  }, [company]);

  if (isLoadingProfile) {
    return (
      <div className="profile-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Cargando perfil profesional...</p>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="profile-error">
        <h2>No se encontró el profesional</h2>
        <button onClick={() => window.history.back()}>Volver</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-page__layout container">
        {/* Left Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar__avatar-container">
            <div 
              className={`avatar-frame ${hasReels ? "pulse-reel" : ""} ${isVerified ? "verified-ring" : ""}`}
              onClick={() => hasReels && setSelectedReel(profReels[0])}
            >
              <img src={avatar} alt={name} className="avatar-image" />
              {isVerified && (
                <div className="verified-badge-premium">
                  <CheckCircle size={16} />
                </div>
              )}
              {hasReels && (
                <div className="reel-indicator">
                  <Play size={12} fill="currentColor" />
                </div>
              )}
            </div>
          </div>

          <div className="profile-sidebar__info">
            <h1 className="name">{name}</h1>
            <p className="title">{professional.bio?.slice(0, 50) || "Servicios Profesionales"}</p>
          </div>

          <div className="profile-sidebar__stats">
            <div className="stat-item">
              <div className="stat-content">
                <Star size={14} className="stat-icon" />
                <span className="stat-value">{professional.rating_avg || "5.0"}</span>
              </div>
              <span className="stat-label">CALIFICACIÓN</span>
            </div>
            <div className="stat-item">
              <div className="stat-content">
                <MessageCircle size={14} className="stat-icon" />
                <span className="stat-value">{professional.completed_jobs || "0"}</span>
              </div>
              <span className="stat-label">TRABAJOS</span>
            </div>
            <div className="stat-item">
              <div className="stat-content">
                <span className="stat-value">{professional.years_experience || "1"}a</span>
              </div>
              <span className="stat-label">EXP.</span>
            </div>
          </div>

          {profile?.website && (
            <div className="profile-sidebar__social">
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="website-link"
              >
                Página Web <ArrowUpRight size={14} />
              </a>
            </div>
          )}

          <PaymentMethodsCard methods={paymentMethods} />

          <BankPromosCard
            promotions={profBankPromos}
            onOpenPromos={() => setIsBankPromosModalOpen(true)}
          />

          {profPromotions.length > 0 && (
            <button
              className="cta-button promos-btn"
              onClick={() => setIsPromosModalOpen(true)}
            >
              VER PROMOCIONES SEMANALES <Star size={18} />
            </button>
          )}

          <button
            className="cta-button message-btn"
            onClick={() => navigate(`/messages?to=${id}`)}
          >
            ENVIAR MENSAJE <MessageCircle size={18} />
          </button>
        </aside>

        {/* Right Content */}
        <section className="profile-content">
          <header className="profile-content__header">
            <div className="location-info">
              <span>
                {company?.Address?.Province?.name || "Provincia"}, {company?.Address?.city || "Ciudad"}
              </span>
            </div>
            <p className="bio">{professional.bio || "Sin biografía disponible."}</p>
          </header>

          <div className="profile-section">
            <div className="section-header">
              <h2>PORTAFOLIO</h2>
              <button
                onClick={() => setIsPortfolioModalOpen(true)}
                className="ver-todo"
              >
                VER TODO
              </button>
            </div>
            <div className="portfolio-grid">
              {images.slice(0, 8).map((img, idx) => (
                <div key={img.id} className="portfolio-item">
                  <img src={img.image_url} alt={img.caption || `Work ${idx}`} />
                </div>
              ))}
              {images.length === 0 && <p className="empty-msg">No hay imágenes en el portafolio.</p>}
            </div>
          </div>

          {/* Promociones y Promos Bancarias se movieron a Modals para experiencia flotante */}

          <div className="profile-section">
            <div className="section-header">
              <h2>SERVICIOS</h2>
              <div className="section-header__actions">
                <div className="carousel-nav">
                  <button onClick={() => scrollContainer(servicesScroll.ref, 'left')} className="nav-btn"><ChevronLeft size={20} /></button>
                  <button onClick={() => scrollContainer(servicesScroll.ref, 'right')} className="nav-btn"><ChevronRight size={20} /></button>
                </div>
                <button
                  onClick={() => setIsServicesModalOpen(true)}
                  className="ver-todo"
                >
                  VER TODO
                </button>
              </div>
            </div>
            <div
              className={`services-scroll-container ${servicesScroll.isDragging ? "dragging" : ""}`}
              ref={servicesScroll.ref}
              {...servicesScroll.events}
            >
              <div className="services-scroll">
                {services.map((service) => (
                  <div 
                    key={service.id} 
                    className="service-card-mini"
                    onClick={() => !servicesScroll.isDragging && setSelectedServiceForDetail(service)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="service-card-mini__header">
                      <h3>{service.name}</h3>
                      <span className="price">${service.base_price?.toLocaleString()}</span>
                    </div>
                    <p>{service.description}</p>
                  </div>
                ))}
                {services.length === 0 && <p className="empty-msg">No hay servicios disponibles.</p>}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>VIDEOS PROFESIONALES</h2>
            </div>
            <div className="videos-instagram-grid">
              {videos.map((video) => (
                <ProfileVideoCard 
                  key={video.id} 
                  video={video} 
                  onSelect={setSelectedVideo}
                />
              ))}
              {videos.length === 0 && <p className="empty-msg">No hay videos disponibles.</p>}
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>OPINIONES</h2>
            </div>
            <div className="testimonials-grid">
              {reviews.map((review) => (
                <TestimonialCard
                  key={review.id}
                  name={review.Profile?.display_name || "Usuario"}
                  photo={review.Profile?.avatar_url}
                  text={review.comment}
                  rating={review.rating}
                  commentPhoto={review.image_url}
                />
              ))}
              {reviews.length === 0 && (
                <div className="empty-reviews">
                  <p>Todavía este profesional/comercio no tiene opiniones.</p>
                </div>
              )}
            </div>
          </div>

          {products.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h2>CATÁLOGO DE PRODUCTOS</h2>
                <button 
                  className="ver-todo"
                  onClick={() => navigate(`${ROUTES.products}?professionalId=${id}`)}
                >
                  VER TODOS
                </button>
              </div>
              <div 
                className={`products-scroll-container ${productsScroll.isDragging ? "dragging" : ""}`}
                ref={productsScroll.ref}
                {...productsScroll.events}
              >
                <div className="products-scroll">
                  {products.slice(0, 20).map((product) => (
                    <div key={product.id} className="product-card-carousel-item">
                      <ProductCard
                        product={product}
                        onOpenDetail={(p) => setSelectedProductForDetail(p)}
                        variant="small"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <Modal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        title="Galería Completa"
      >
        <div className="modal-portfolio-grid">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.image_url}
              alt={img.caption || "Portafolio"}
              className="modal-image"
            />
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        title="Todos los Servicios"
      >
        <div className="modal-services-list">
          {services.map((service) => (
            <div key={service.id} className="service-card-compact">
              <div className="service-info">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
              <span className="service-price">${service.base_price?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isBankPromosModalOpen}
        onClose={() => setIsBankPromosModalOpen(false)}
        title="Promociones Bancarias"
      >
        <div className="modal-bank-promos-grid">
          {profBankPromos.map((promo) => {
            const bankNames = getBankNames(promo);
            return (
              <div 
                key={promo.id} 
                className="bank-promo-card-premium"
                onClick={() => setSelectedPromoForDetail({ ...promo, type: 'bank' })}
              >
                <div className="bank-promo-header">
                  <div className="bank-names-stack">
                    {bankNames.map((bn: any) => (
                      <span key={bn} className="bank-name-badge">{bn}</span>
                    ))}
                  </div>
                  <span className="discount-circle">{promo.percentaje_discount}%</span>
                </div>
                <p className="description">{promo.description}</p>
                <div className="bank-promo-footer">
                  <span>Reintegro: ${promo.refund || 'Sin tope'}</span>
                  <span className="days">
                    {[
                      promo.monday && 'L',
                      promo.tuesday && 'M',
                      promo.wednesday && 'M',
                      promo.thursday && 'J',
                      promo.friday && 'V',
                      promo.saturday && 'S',
                      promo.sunday && 'D'
                    ].filter(Boolean).join(' ')}
                  </span>
                </div>
              </div>
            );
          })}
          {profBankPromos.length === 0 && <p className="empty-msg">No hay promociones bancarias vigentes.</p>}
        </div>
      </Modal>

      <Modal
        isOpen={isPromosModalOpen}
        onClose={() => setIsPromosModalOpen(false)}
        title="Ofertas Especiales"
      >
        <div className="modal-promotions-grid">
          {profPromotions.map((promo) => (
            <div 
              key={promo.id} 
              className="promo-card-premium"
              onClick={() => setSelectedPromoForDetail({ ...promo, type: 'prof' })}
              style={{ cursor: 'pointer' }}
            >
              {promo.image_url && <img src={promo.image_url} alt={promo.title} className="promo-img" />}
              <div className="promo-info">
                <span className="promo-badge">{promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `$${promo.discount_value} OFF`}</span>
                <h3>{promo.title}</h3>
                <p>{promo.description}</p>
                {promo.expires_at && <span className="expires">Expira: {new Date(promo.expires_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
          {profPromotions.length === 0 && <p className="empty-msg">No hay promociones vigentes en este momento.</p>}
        </div>
      </Modal>

      {/* Unified Promotion Detail Modal */}
      <PromotionDetailModal
        promo={selectedPromoForDetail}
        isOpen={!!selectedPromoForDetail}
        onClose={() => setSelectedPromoForDetail(null)}
      />

      {/* Reel Modal Overlay */}
      {selectedReel && (
        <div className="reel-overlay" onClick={() => setSelectedReel(null)}>
          <div className="reel-modal-container" onClick={e => e.stopPropagation()}>
            <video 
              src={selectedReel.video_url} 
              autoPlay 
              controls 
              loop 
              className="reel-video-full"
            />
            <button className="reel-close" onClick={() => setSelectedReel(null)}>×</button>
          </div>
        </div>
      )}

      {/* Video Modal Overlay */}
      {selectedVideo && (
        <div className="reel-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="reel-modal-container video-expanded" onClick={e => e.stopPropagation()}>
            <video 
              src={selectedVideo.video_url} 
              autoPlay 
              controls 
              className="reel-video-full"
            />
            <div className="video-expanded__info">
              <h3>{selectedVideo.title}</h3>
              <p>{selectedVideo.description}</p>
            </div>
            <button className="reel-close" onClick={() => setSelectedVideo(null)}>×</button>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedServiceForDetail}
        isOpen={!!selectedServiceForDetail}
        onClose={() => setSelectedServiceForDetail(null)}
      />

      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <Modal
          isOpen={!!selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          title="Detalle del Producto"
          maxWidth="500px"
        >
          <div className="profile-product-detail">
            <div className="product-detail-image-main">
              <img 
                src={selectedProductForDetail.images?.[0]?.image_url || selectedProductForDetail.image_url || "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"} 
                alt={selectedProductForDetail.name} 
              />
            </div>
            <div className="product-detail-info">
              <h2 className="product-detail-title">{selectedProductForDetail.name}</h2>
              <div className="product-detail-pricing">
                {selectedProductForDetail.original_price && (
                  <span className="original-price">${selectedProductForDetail.original_price.toLocaleString()}</span>
                )}
                <div className="current-price-row">
                  <span className="current-price">${selectedProductForDetail.price?.toLocaleString()}</span>
                  {selectedProductForDetail.discount_percentage > 0 && (
                    <span className="discount-badge">-{selectedProductForDetail.discount_percentage}% OFF</span>
                  )}
                </div>
              </div>
              <div className="product-detail-description">
                <h4>Descripción</h4>
                <p>{selectedProductForDetail.description || "Sin descripción disponible."}</p>
              </div>
              <button 
                className="contact-professional-btn"
                onClick={() => {
                  navigate(`/messages?to=${id}`);
                  setSelectedProductForDetail(null);
                }}
              >
                <MessageCircle size={18} /> CONSULTAR AL PROFESIONAL
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  );
}
