import { useState, useRef } from "react";
import { Star, MessageCircle, Phone, ArrowUpRight, Play } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Modal from "../../components/Modal/Modal";
import PaymentMethodsCard from "../../components/Cards/PaymentMethodsCard";
import BankPromosCard from "../../components/Cards/BankPromosCard";
import { services } from "../../data/services";
import { showcasedSpecialist } from "../../data/specialists";
import "./ProfilePage.css";

// Custom hook for drag-to-scroll
function useDraggableScroll() {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e) => {
    if (!isDragging) return;
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

export default function ProfilePage() {
  const {
    name,
    title,
    bio,
    city,
    province,
    whatsapp,
    website,
    rating,
    reviews,
    yearsOfExperience,
    avatar,
    portfolio,
    testimonials,
    paymentMethods,
    bankPromotions,
    videos,
  } = showcasedSpecialist;

  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isTestimonialsModalOpen, setIsTestimonialsModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isBankPromosModalOpen, setIsBankPromosModalOpen] = useState(false);

  const servicesScroll = useDraggableScroll();
  const testimonialsScroll = useDraggableScroll();
  const videosScroll = useDraggableScroll();

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-page__layout container">
        {/* Left Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar__avatar-container">
            <div className="avatar-frame">
              <img src={avatar} alt={name} className="avatar-image" />
              <div className="verified-badge">✓</div>
            </div>
          </div>

          <div className="profile-sidebar__info">
            <h1 className="name">{name}</h1>
            <p className="title">{title}</p>
          </div>

          <div className="profile-sidebar__stats">
            <div className="stat-item">
              <div className="stat-content">
                <Star size={14} className="stat-icon" />
                <span className="stat-value">{rating}</span>
              </div>
              <span className="stat-label">CALIFICACIÓN</span>
            </div>
            <div className="stat-item">
              <div className="stat-content">
                <MessageCircle size={14} className="stat-icon" />
                <span className="stat-value">{reviews}</span>
              </div>
              <span className="stat-label">TRABAJOS</span>
            </div>
            <div className="stat-item">
              <div className="stat-content">
                <span className="stat-value">{yearsOfExperience}a</span>
              </div>
              <span className="stat-label">EXP.</span>
            </div>
          </div>

          {website && (
            <div className="profile-sidebar__social">
              <a
                href={website}
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
            promotions={bankPromotions}
            onOpenPromos={() => setIsBankPromosModalOpen(true)}
          />

          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
            className="cta-button whatsapp"
            target="_blank"
            rel="noreferrer"
          >
            SOLICITAR SERVICIO <Phone size={18} />
          </a>
        </aside>

        {/* Right Content */}
        <section className="profile-content">
          <header className="profile-content__header">
            <div className="location-info">
              <span>
                {city}, {province}
              </span>
            </div>
            <p className="bio">{bio}</p>
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
              {portfolio.slice(0, 8).map((image, idx) => (
                <div key={idx} className="portfolio-item">
                  <img src={image} alt={`Work ${idx}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>VIDEOS</h2>
            </div>
            <div
              className={`videos-scroll-container ${videosScroll.isDragging ? "dragging" : ""}`}
              ref={videosScroll.ref}
              {...videosScroll.events}
            >
              <div className="videos-scroll">
                {videos.map((video) => (
                  <div key={video.id} className="reel-card-profile">
                    <div className="reel-card-profile__video-wrap">
                      <video
                        src={video.url}
                        className="reel-card-profile__video"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) =>
                          ((e.target as HTMLVideoElement).currentTime = 0.01)
                        }
                      />
                      <button
                        className="reel-card-profile__play"
                        tabIndex={0}
                        aria-label={`Reproducir video: ${video.title}`}
                      >
                        <Play size={24} fill="white" />
                      </button>
                    </div>
                    <div className="reel-card-profile__info">
                      <div className="reel-card-profile__title">
                        {video.title}
                      </div>
                      {video.description && (
                        <div className="reel-card-profile__desc">
                          {video.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                      <span className="price">{service.base_price}</span>
                    </div>
                    <p>{service.description}</p>
                    <button className="select-service-btn">Seleccionar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>TESTIMONIOS</h2>
              <button
                onClick={() => setIsTestimonialsModalOpen(true)}
                className="ver-todo"
              >
                VER TODO
              </button>
            </div>
            <div
              className={`testimonials-scroll-container ${testimonialsScroll.isDragging ? "dragging" : ""}`}
              ref={testimonialsScroll.ref}
              {...testimonialsScroll.events}
            >
              <div className="testimonials-scroll">
                {testimonials.map((test) => (
                  <div key={test.id} className="testimonial-card">
                    <div className="testimonial-header">
                      <img
                        src={test.photo}
                        alt={test.author}
                        className="author-photo"
                      />
                      <div className="author-info">
                        <h3>{test.author}</h3>
                        <div className="rating">{"★".repeat(test.rating)}</div>
                      </div>
                      <MessageCircle className="quote-icon" size={24} />
                    </div>
                    <p className="testimonial-text">"{test.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>VIDEOS</h2>
            </div>
            <div
              className={`videos-scroll-container ${videosScroll.isDragging ? "dragging" : ""}`}
              ref={videosScroll.ref}
              {...videosScroll.events}
            >
              <div className="videos-scroll">
                {videos.map((video) => (
                  <div key={video.id} className="video-card-mini">
                    <video
                      src={video.url}
                      controls
                      poster=""
                      className="video-card-mini__video"
                    />
                    <div className="video-card-mini__info">
                      <h3>{video.title}</h3>
                      <p>{video.description}</p>
                    </div>
                  </div>
                ))}
              </div>
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
          {portfolio.map((image, idx) => (
            <img
              key={idx}
              src={image}
              alt={`Work Full ${idx}`}
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
              <span className="service-price">{service.base_price}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isTestimonialsModalOpen}
        onClose={() => setIsTestimonialsModalOpen(false)}
        title="Todos los Testimonios"
      >
        <div className="modal-testimonials-list">
          {testimonials.map((test) => (
            <div key={test.id} className="testimonial-card modal-version">
              <div className="testimonial-header">
                <img
                  src={test.photo}
                  alt={test.author}
                  className="author-photo"
                />
                <div>
                  <h3>{test.author}</h3>
                  <div className="rating">{"★".repeat(test.rating)}</div>
                </div>
              </div>
              <p className="testimonial-text">"{test.text}"</p>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isBankPromosModalOpen}
        onClose={() => setIsBankPromosModalOpen(false)}
        title="Promociones Bancarias"
      >
        <div className="bank-promos-modal-content">
          <div className="promo-days-grid">
            {bankPromotions.map((promo, idx) => (
              <div key={idx} className="promo-day-row">
                <div className="day-badge">
                  <span className="day-name">{promo.day}</span>
                </div>
                <div className="bank-info">
                  <div className="bank-logo-container">
                    <img
                      src={promo.logo}
                      alt={promo.bank}
                      className="bank-logo"
                    />
                  </div>
                  <div className="bank-details">
                    <span className="bank-name">{promo.bank}</span>
                    <span className="bank-discount">
                      {promo.discount} de descuento
                    </span>
                  </div>
                </div>
                <div className="promo-cta">Aprovechar</div>
              </div>
            ))}
          </div>
          <p className="promo-footer">
            Válido para pagos con tarjeta de crédito y débito. Sujeto a términos
            y condiciones de cada entidad bancaria.
          </p>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
