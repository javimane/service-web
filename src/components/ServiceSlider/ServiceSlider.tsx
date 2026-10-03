"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import useCarouselDrag from "@/hooks/useCarouselDrag";
import ServiceCard from "../Cards/ServiceCard";
import "./ServiceSlider.css";

export interface ServiceSliderProps {
  title: string;
  subtitle?: string;
  badge?: {
    icon?: React.ReactNode;
    text: string;
  };
  services: any[];
  isLoading?: boolean;
  viewAllLink?: string;
  viewAllText?: string;
  onServiceClick?: (service: any) => void;
  className?: string;
}

export default function ServiceSlider({
  title,
  subtitle,
  badge,
  services = [],
  isLoading = false,
  viewAllLink,
  viewAllText = "Ver todo",
  onServiceClick,
  className = "",
}: ServiceSliderProps) {
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
  } = useCarouselDrag(sliderRef, ".service-slider__item");

  const handleServiceClick = (service: any) => {
    if (onServiceClick) {
      onServiceClick(service);
      return;
    }
    const slug =
      service.seo_path ||
      service.seoPath ||
      (service.name
        ? service.name.trim().toLowerCase().replace(/\s+/g, "-")
        : `service-${service.id}`);
    router.push(`/servicios/${slug}?id=${service.id}`);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isLoading && (!services || services.length === 0)) {
    return null;
  }

  return (
    <section className={`service-slider ${className}`.trim()}>
      <div className="service-slider__header">
        <div className="service-slider__title-group">
          {badge && (
            <span className="service-slider__badge">
              {badge.icon} {badge.text}
            </span>
          )}
          <h2 className="service-slider__title">
            {title}
            {services.length > 0 && (
              <span className="service-slider__count">({services.length})</span>
            )}
          </h2>
          {subtitle && <p className="service-slider__subtitle">{subtitle}</p>}
        </div>

        {viewAllLink && (
          <Link href={viewAllLink} className="service-slider__link">
            {viewAllText} <span aria-hidden="true">&gt;</span>
          </Link>
        )}
      </div>

      <div className="service-slider__wrap">
        {isLoading ? (
          <div className="service-slider__loading">
            <Loader2 className="animate-spin" size={28} />
            <span>Cargando servicios...</span>
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
              className="service-slider__scroll"
              onScroll={updateArrowVisibility}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {services.map((service: any, idx: number) => {
                const key = service.id || `service-${idx}`;
                return (
                  <div key={key} className="service-slider__item">
                    <ServiceCard
                      service={service}
                      viewMode="grid"
                      onClick={handleServiceClick}
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
