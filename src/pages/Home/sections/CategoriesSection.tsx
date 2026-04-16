import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categories } from "../../../data/categories";
import CategoryCard from "../../../components/Cards/CategoryCard";
import "./CategoriesSection.css";

export default function CategoriesSection() {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrowVisibility = () => {
    const slider = sliderRef.current;
    if (!slider) return;

    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
    setShowLeftArrow(slider.scrollLeft > 10);
    setShowRightArrow(slider.scrollLeft < maxScrollLeft - 10);
  };

  const scrollCarousel = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const card = slider.querySelector(".category-card");
    const cardWidth = card?.offsetWidth ?? 250;
    const gap = 16;

    slider.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateArrowVisibility();
  }, []);

  const handlePointerDown = (event) => {
    const slider = sliderRef.current;
    if (!slider || event.button !== 0) return;

    isDragging.current = true;
    slider.setPointerCapture(event.pointerId);
    slider.classList.add("is-dragging");
    startX.current = event.clientX - slider.offsetLeft;
    scrollLeft.current = slider.scrollLeft;
  };

  const stopDragging = (event) => {
    const slider = sliderRef.current;
    if (!slider) return;

    isDragging.current = false;
    slider.classList.remove("is-dragging");
    if (event?.pointerId) {
      slider.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event) => {
    const slider = sliderRef.current;
    if (!slider || !isDragging.current) return;

    event.preventDefault();
    const x = event.clientX - slider.offsetLeft;
    const walk = (x - startX.current) * 1.25;
    slider.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <section className="categories-section">
      <div className="categories-section__header">
        <div>
          <span className="section-label">Explorar</span>
          <h2 className="categories-section__title">Categorías</h2>
        </div>
        <button
          className="section-link"
          onClick={() => navigate("/categories")}
        >
          Ver todo
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
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
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
