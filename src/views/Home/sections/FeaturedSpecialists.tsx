"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { professionalService } from "../../../services/professionalService";
import SpecialistCard from "../../../components/Cards/SpecialistCard";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./FeaturedSpecialists.css";

export default function FeaturedSpecialists() {
  const [userProvince, setUserProvince] = useState("Buenos Aires");
  const sliderRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setUserProvince(localStorage.getItem("userProvince") || "Buenos Aires");
  }, []);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".specialist-card");

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["featured-professionals", userProvince],
    queryFn: () =>
      professionalService.list({
        province: userProvince,
        limit: 20,
        sortBy: "rating",
        subscription: "premium",
      }),
  });

  const specialistsList = useMemo(() => {
    return professionals.map((p: any) => ({
      id: p.id,
      name: p.Profile?.display_name || p.Company?.name || "Profesional",
      specialty: p.bio || "Servicios Profesionales",
      rating: p.rating_avg || 5.0,
      avatar:
        p.Profile?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(p.Profile?.display_name || "P")}&background=random`,
      seoPath: p.seo_path || null,
    }));
  }, [professionals]);

  return (
    <section className="featured-specialists">
      <div className="home-section-container">
        <div className="featured-specialists__header">
          <div className="featured-specialists__title-group">
            <h2 className="featured-specialists__title">
              Especialistas Destacados
            </h2>
            <p className="featured-specialists__subtitle">
              Los profesionales mejor valorados en {userProvince}
            </p>
          </div>
          <button className="section-link">
            Ver todos <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
        <div className="featured-specialists__carousel">
          {isLoading ? (
            <div className="featured-specialists__loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Buscando a los mejores profesionales...</p>
            </div>
          ) : specialistsList.length === 0 ? (
            <div className="featured-specialists__empty">
              <Star size={40} className="empty-icon" />
              <h3>Aún no hay destaques en {userProvince}</h3>
              <p>Estamos expandiendo nuestra red de profesionales premium.</p>
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
                className="featured-specialists__scroll"
                onScroll={updateArrowVisibility}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {specialistsList.map((specialist) => (
                  <SpecialistCard key={specialist.id} specialist={specialist} />
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
      </div>
    </section>
  );
}
