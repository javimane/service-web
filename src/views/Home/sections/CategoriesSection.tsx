"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getServiceCategoriesAction } from "../../../app/actions/categories";
import CategoryCard from "../../../components/Cards/CategoryCard";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import { ROUTES } from "../../../routes/paths";
import "./CategoriesSection.css";

export default function CategoriesSection() {
  const router = useRouter();
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

  const { data: rawCategories = [] } = useQuery({
    queryKey: ["home-categories-list"],
    queryFn: async () => {
      const res = await getServiceCategoriesAction();
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const categories = rawCategories.map((c: any) => ({
    id: c.id,
    name: c.name,
    label: c.name,
    type: c.name,
    seoPath: c.seo_path,
    image: c.image_url || "",
  }));

  const goToCategories = (seoPath?: string) => {
    if (seoPath) {
      try {
        // seoPath may be like "/categories?category=Aberturas" coming from API
        const parts = seoPath.split("?");
        const query = parts[1] ? new URLSearchParams(parts[1]) : null;
        const categoryParam = query?.get("category");
        if (categoryParam) {
          router.push(
            `${ROUTES.categories}?category=${encodeURIComponent(categoryParam)}`,
          );
          return;
        }
      } catch (e) {
        // fallback to pushing raw seoPath if parsing fails
        router.push(seoPath);
        return;
      }
    }

    router.push(ROUTES.categories);
  };

  return (
    <section className="categories-section">
      <div className="home-section-container">
        <div className="categories-section__header">
          <h2 className="categories-section__title">Explorá Categorías</h2>
          <button
            type="button"
            className="section-link"
            onClick={() => goToCategories()}
          >
            Ver categorías <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
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
                onClick={() => goToCategories(category.seoPath)}
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
      </div>
    </section>
  );
}
