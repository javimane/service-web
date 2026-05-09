import { useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, MessageCircle, Phone, ArrowUpRight, Loader2, Play, Heart, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { professionalService } from "../../services/professionalService";
import { serviceService } from "../../services/serviceService";
import { professionalImagesService } from "../../services/professionalImagesService";
import { videosService } from "../../services/videosService";
import { reelsService } from "../../services/reelsService";
import { reviewService } from "../../services/reviewService";
import TestimonialCard from "./sections/TestimonialCard";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Modal from "../../components/Modal/Modal";
import PaymentMethodsCard from "../../components/Cards/PaymentMethodsCard";
import BankPromosCard from "../../components/Cards/BankPromosCard";
import "./ProfilePage.css";

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
  const [selectedReel, setSelectedReel] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const servicesScroll = useDraggableScroll();
  const videosScroll = useDraggableScroll();

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

  const profReels = useMemo(() => {
    return allReels.filter(r => r.professional_id === Number(id));
  }, [allReels, id]);

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

  const profile = professional.Profile;
  const company = professional.Company;
  const name = profile?.display_name || company?.name || "Profesional";
  const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  const isVerified = professional.is_verified;
  const hasReels = profReels.length > 0;

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-page__layout container">
        {/* Left Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar__avatar-container">
            <div 
              className={`avatar-frame ${hasReels ? "pulse-reel" : ""}`}
              onClick={() => hasReels && setSelectedReel(profReels[0])}
            >
              <img src={avatar} alt={name} className="avatar-image" />
              {isVerified && <div className="verified-badge">✓</div>}
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

          <PaymentMethodsCard methods={[]} />

          <BankPromosCard
            promotions={[]}
            onOpenPromos={() => setIsBankPromosModalOpen(true)}
          />

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

          <div className="profile-section">
            <div className="section-header">
              <h2>SERVICIOS</h2>
              <button
                onClick={() => setIsServicesModalOpen(true)}
                className="ver-todo"
              >
                VER TODO
              </button>
            </div>
            <div
              className={`services-scroll-container ${servicesScroll.isDragging ? "dragging" : ""}`}
              ref={servicesScroll.ref}
              {...servicesScroll.events}
            >
              <div className="services-scroll">
                {services.map((service) => (
                  <div key={service.id} className="service-card-mini">
                    <div className="service-card-mini__header">
                      <h3>{service.name}</h3>
                      <span className="price">${service.base_price?.toLocaleString()}</span>
                    </div>
                    <p>{service.description}</p>
                    <button className="select-service-btn">Seleccionar</button>
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

      <Footer />
    </div>
  );
}
