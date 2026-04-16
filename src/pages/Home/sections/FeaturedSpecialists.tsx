import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { featuredSpecialists } from "../../../data/specialists";
import SpecialistCard from "../../../components/Cards/SpecialistCard";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./FeaturedSpecialists.css";

export default function FeaturedSpecialists() {
  const sliderRef = useRef(null);
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
        <div>
          <span className="section-label">Profesionales</span>
          <h2 className="featured-specialists__title">
            Especialistas Destacados
          </h2>
        </div>
        <button className="section-link">Ver todo</button>
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
