"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Store,
  Star,
  ArrowRight,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../context/AuthModalContext";
import { ROUTES } from "../../../routes/paths";
import { bannerService, ApiBanner } from "../../../services/bannerService";
import "./BannerCarousel.css";

interface CarouselBanner {
  id: string;
  type: string;
  title?: string | null;
  highlight?: string | null;
  text?: string | null;
  buttonText?: string | null;
  icon?: any;
  imageUrl?: string | null;
  linkUrl?: string | null;
  route?: string | null;
  cssClass?: string;
  specialClass?: string;
}

const DEFAULT_BANNERS: CarouselBanner[] = [
  {
    id: "buyer-protection",
    type: "buyer-protection",
    title: "COMPRA PROTEGIDA",
    text: "Comprá productos y contratá servicios con el respaldo de Sercio. Conocé cómo reclamar y cuándo corresponde una devolución.",
    buttonText: "CONOCÉ TUS DERECHOS",
    icon: ShieldCheck,
    route: "/devoluciones",
    cssClass: "banner-slide--buyer-protection",
  },
  {
    id: "referrals",
    type: "referrals",
    title: "¡Ganá dinero recomendando!",
    highlight: "$10.000",
    text: "Unite a nuestra red de referidos y ganá $10.000 por cada profesional o comercio que se sume gracias a vos.",
    buttonText: "EMPEZAR A REFERIR",
    icon: Users,
    cssClass: "banner-slide--referrals",
  },
  {
    id: "register",
    type: "register",
    title: "¿Tenés un comercio o sos profesional?",
    text: "Registrate hoy mismo, llegá a más clientes y hacé crecer tu negocio en nuestra red exclusiva.",
    buttonText: "REGISTRARME AHORA",
    icon: Store,
    cssClass: "banner-slide--register",
  },
  {
    id: "promotions",
    type: "promos",
    title: "OFERTAS IMPERDIBLES",
    text: "Descubrí las mejores promociones de la semana. Descuentos exclusivos que no vas a querer perderte.",
    buttonText: "VER PROMOCIONES",
    icon: Star,
    cssClass: "banner-slide--promos",
    specialClass: "banner-promos-glow",
  },
];

export default function BannerCarousel() {
  const [dynamicBanners, setDynamicBanners] = useState<CarouselBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    let mounted = true;
    bannerService
      .getActiveBanners()
      .then((items: ApiBanner[]) => {
        if (!mounted || !Array.isArray(items) || items.length === 0) return;
        const mapped: CarouselBanner[] = items.map((b) => ({
          id: b.id,
          type: "custom",
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl || b.route || null,
          route: b.linkUrl || b.route || null,
          cssClass: "banner-slide--custom",
        }));
        setDynamicBanners(mapped);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const allBanners = useMemo<CarouselBanner[]>(() => {
    return [...dynamicBanners, ...DEFAULT_BANNERS];
  }, [dynamicBanners]);

  const total = allBanners.length;

  const next = useCallback(() => {
    if (total <= 1) return;
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = () => {
    if (total <= 1) return;
    setCurrent((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, total]);

  const handleAction = (banner: CarouselBanner) => {
    const destination = (banner.linkUrl || banner.route)?.trim();
    if (destination) {
      if (
        destination.startsWith("http://") ||
        destination.startsWith("https://")
      ) {
        window.open(destination, "_blank", "noopener,noreferrer");
        return;
      }
      router.push(destination);
      return;
    }

    if (banner.type === "referrals") {
      if (user) {
        router.push(`${ROUTES.dashboard}?view=referrals`);
      } else {
        openAuth("login");
      }
    } else if (banner.type === "register") {
      openAuth("register");
    } else if (banner.type === "promos") {
      router.push(ROUTES.promotions);
    }
  };

  return (
    <section className="banner-carousel">
      <div className="banner-carousel__container container">
        <div
          className="banner-carousel__track"
          style={
            {
              "--slide-offset": `translateX(-${current * 100}%)`,
            } as React.CSSProperties
          }
        >
          {allBanners.map((banner) => {
            const isImageOnly = Boolean(
              banner.imageUrl && banner.imageUrl.trim() !== "",
            );

            if (isImageOnly) {
              const hasLink = Boolean(banner.linkUrl || banner.route);
              return (
                <div
                  key={banner.id}
                  className="banner-slide banner-slide--image"
                  onClick={() => handleAction(banner)}
                  style={{ cursor: hasLink ? "pointer" : "default" }}
                >
                  <img
                    src={banner.imageUrl!}
                    alt={banner.title || "Banner"}
                    className="banner-slide__img"
                    loading="lazy"
                  />
                </div>
              );
            }

            const Icon = banner.icon;
            const hasLink = Boolean(banner.linkUrl || banner.route);

            return (
              <div
                key={banner.id}
                className={`banner-slide ${banner.imageUrl ? "banner-slide--custom" : banner.cssClass || ""} ${banner.specialClass || ""}`}
                onClick={
                  banner.imageUrl && hasLink
                    ? () => handleAction(banner)
                    : undefined
                }
                style={
                  banner.imageUrl && hasLink ? { cursor: "pointer" } : undefined
                }
              >
                {banner.imageUrl && (
                  <div className="banner-slide__bg-img">
                    <img src={banner.imageUrl} alt="" aria-hidden="true" />
                    <div className="banner-slide__overlay" />
                  </div>
                )}

                <div className="banner-slide__content">
                  <div className="banner-slide__info">
                    {Icon && (
                      <div className="banner-slide__icon-wrap">
                        <Icon size={30} />
                      </div>
                    )}
                    <div className="banner-slide__text-group">
                      {banner.title && (
                        <h3>
                          {banner.title}{" "}
                          {banner.highlight && (
                            <span className="banner-slide__highlight">
                              {banner.highlight}
                            </span>
                          )}
                        </h3>
                      )}
                      {banner.text && <p>{banner.text}</p>}
                    </div>
                  </div>
                  {(banner.buttonText || hasLink) && (
                    <button
                      className="banner-slide__btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(banner);
                      }}
                    >
                      {banner.buttonText || "VER MÁS"}
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            className="banner-carousel__nav banner-carousel__nav--prev"
            onClick={prev}
            aria-label="Banner anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            className="banner-carousel__nav banner-carousel__nav--next"
            onClick={next}
            aria-label="Siguiente banner"
          >
            <ChevronRight size={24} />
          </button>

          <div className="banner-carousel__dots">
            {allBanners.map((_, i) => (
              <button
                key={i}
                className={`banner-dot ${i === current ? "active" : ""}`}
                onClick={() => setCurrent(i)}
                aria-label={`Ir al banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
