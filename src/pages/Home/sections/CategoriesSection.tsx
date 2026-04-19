import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categories } from "../../../data/categories";
import CategoryCard from "../../../components/Cards/CategoryCard";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import { ROUTES } from "../../../routes/paths";
import "./CategoriesSection.css";

export default function CategoriesSection() {
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement>(null);
  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".cat-minimal-card");

  const goToCategories = (categoryLabel?: string) => {
    if (categoryLabel) {
      navigate(
        `${ROUTES.categories}?category=${encodeURIComponent(categoryLabel)}`,
      );
      return;
    }

    navigate(ROUTES.categories);
  };

  return (
    <section className="categories-section">
      <div className="categories-section__header">
        <h2 className="categories-section__title">Carrusel de Categorías</h2>
        <button
          type="button"
          className="section-link"
          onClick={() => goToCategories()}
        >
          Ver categorías &gt;
        </button>
      </div>

      <div className="categories-section__carousel">
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
          className="categories-section__scroll"
          onScroll={updateArrowVisibility}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => goToCategories(category.label)}
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
      </div>
    </section>
  );
}
