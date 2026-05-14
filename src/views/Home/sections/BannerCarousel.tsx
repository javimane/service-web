"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Store,
  Star,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../context/AuthModalContext";
import { ROUTES } from "../../../routes/paths";
import "./BannerCarousel.css";

const BANNERS = [
  {
    id: "referrals",
    type: "referrals",
    title: "¡Ganá dinero recomendando!",
    highlight: "$5.000",
    text: "Unite a nuestra red de referidos y ganá $5.000 por cada profesional o comercio que se sume gracias a vos.",
    buttonText: "EMPEZAR A REFERIR",
    icon: Users,
    bg: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  },
  {
    id: "register",
    type: "register",
    title: "¿Tenés un comercio o sos profesional?",
    text: "Registrate hoy mismo, llegá a más clientes y hacé crecer tu negocio en nuestra red exclusiva.",
    buttonText: "REGISTRARME AHORA",
    icon: Store,
    bg: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
  },
  {
    id: "promotions",
    type: "promos",
    title: "OFERTAS IMPERDIBLES",
    text: "Descubrí las mejores promociones de la semana. Descuentos exclusivos que no vas a querer perderte.",
    buttonText: "VER PROMOCIONES",
    icon: Star,
    bg: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    specialClass: "banner-promos-glow",
  },
];

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prev = () => {
    setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const handleAction = (banner: (typeof BANNERS)[0]) => {
    if (banner.type === "referrals") {
      if (user) {
        router.push(`${ROUTES.dashboard}?view=referrals`);
      } else {
        openAuth("login");
      }
    } else if (banner.type === "register") {
      openAuth("register");
    } else {
      router.push(ROUTES.promotions);
    }
  };

  return (
    <section className="banner-carousel">
      <div className="banner-carousel__container container">
        <div
          className="banner-carousel__track"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {BANNERS.map((banner) => {
            const Icon = banner.icon;
            return (
              <div
                key={banner.id}
                className={`banner-slide ${banner.specialClass || ""}`}
                style={{ background: banner.bg }}
              >
                <div className="banner-slide__content">
                  <div className="banner-slide__info">
                    <div className="banner-slide__icon-wrap">
                      <Icon size={32} />
                    </div>
                    <div className="banner-slide__text-group">
                      <h3>
                        {banner.title}{" "}
                        {banner.highlight && (
                          <span className="banner-slide__highlight">
                            {banner.highlight}
                          </span>
                        )}
                      </h3>
                      <p>{banner.text}</p>
                    </div>
                  </div>
                  <button
                    className="banner-slide__btn"
                    onClick={() => handleAction(banner)}
                  >
                    {banner.buttonText}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="banner-carousel__nav banner-carousel__nav--prev"
        onClick={prev}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="banner-carousel__nav banner-carousel__nav--next"
        onClick={next}
      >
        <ChevronRight size={24} />
      </button>

      <div className="banner-carousel__dots">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            className={`banner-dot ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </section>
  );
}
