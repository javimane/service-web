import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { featuredSpecialists } from "../../../data/specialists";
import SpecialistCard from "../../../components/Cards/SpecialistCard";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./FeaturedSpecialists.css";

export default function FeaturedSpecialists() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".specialist-card");

  return (
    <section className="featured-specialists">
      <div className="featured-specialists__header">
        <h2 className="featured-specialists__title">Profesionales Destacados</h2>
        <button className="featured-specialists__view-all">
          View all &gt;
        </button>
      </div>

      <div className="featured-specialists__carousel">
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
          {featuredSpecialists.map((specialist) => (
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
      </div>
    </section>
  );
}
