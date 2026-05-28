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
import SpecialistCard from "../../../components/Cards/SpecialistCard";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./FeaturedSpecialists.css";
import { getProfessionalsAction } from "@/app/actions/professionals";

export default function FeaturedSpecialists({ userProvince = "Buenos Aires" }: { userProvince?: string }) {
  const sliderRef = useRef(null);

  // Using userProvince from props
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
    queryFn: async () => {
      const result = await getProfessionalsAction({
        provinceId: userProvince,
        limit: 20,
        sortBy: "rating",
      });

      if (result?.data) {
        return result.data;
      }

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
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
            <p className="section-subtitle">
              Los profesionales mejor valorados en {userProvince}
            </p>
          </div>
          <button type="button" className="section-link">
            Ver todo <span>&gt;</span>
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
