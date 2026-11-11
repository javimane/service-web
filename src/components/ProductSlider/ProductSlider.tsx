"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import useCarouselDrag from "@/hooks/useCarouselDrag";
import ProductCard from "../Cards/ProductCard";
import "./ProductSlider.css";

export interface ProductSliderProps {
  title: string;
  subtitle?: string;
  badge?: {
    icon?: React.ReactNode;
    text: string;
  };
  products: any[];
  isLoading?: boolean;
  viewAllLink?: string;
  viewAllText?: string;
  onProductClick?: (product: any) => void;
  className?: string;
}

export default function ProductSlider({
  title,
  subtitle,
  badge,
  products = [],
  isLoading = false,
  viewAllLink,
  viewAllText = "Ver todo",
  onProductClick,
  className = "",
}: ProductSliderProps) {
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
  } = useCarouselDrag(sliderRef, ".product-slider__item");

  const handleProductClick = (product: any) => {
    if (onProductClick) {
      onProductClick(product);
      return;
    }
    const pSeo = product.seo_path || (product.Product && product.Product.seo_path);
    if (pSeo) {
      const target = `/productos${pSeo.startsWith("/") ? pSeo : `/${pSeo}`}`;
      router.push(target);
    } else {
      const productId =
        product.id || product.product_id || (product.Product && product.Product.id);
      const name =
        product.name || (product.Product && product.Product.name) || "producto";
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
      router.push(`/productos/${slug}?id=${productId}`);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className={`product-slider ${className}`.trim()}>
      <div className="product-slider__header">
        <div className="product-slider__title-group">
          {badge && (
            <span className="product-slider__badge">
              {badge.icon} {badge.text}
            </span>
          )}
          <h2 className="product-slider__title">
            {title}
            {products.length > 0 && (
              <span className="product-slider__count">({products.length})</span>
            )}
          </h2>
          {subtitle && <p className="product-slider__subtitle">{subtitle}</p>}
        </div>

        {viewAllLink && (
          <Link href={viewAllLink} className="product-slider__link">
            {viewAllText} <span aria-hidden="true">&gt;</span>
          </Link>
        )}
      </div>

      <div className="product-slider__wrap">
        {isLoading ? (
          <div className="product-slider__loading">
            <Loader2 className="animate-spin" size={28} />
            <span>Cargando productos...</span>
          </div>
        ) : (
          <>
            <button
              className={`carousel-control carousel-control--left ${
                showLeftArrow ? "" : "carousel-control--hidden"
              }`}
              type="button"
              onClick={() => scrollCarousel(-1)}
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div
              ref={sliderRef}
              className="product-slider__scroll"
              onScroll={updateArrowVisibility}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {products.map((product: any, idx: number) => {
                const key =
                  product.id ||
                  product.product_id ||
                  (product.Product && product.Product.id) ||
                  idx;
                return (
                  <div key={key} className="product-slider__item">
                    <ProductCard
                      product={product}
                      onOpenDetail={handleProductClick}
                      variant="small"
                    />
                  </div>
                );
              })}
            </div>

            <button
              className={`carousel-control carousel-control--right ${
                showRightArrow ? "" : "carousel-control--hidden"
              }`}
              type="button"
              onClick={() => scrollCarousel(1)}
              aria-label="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
