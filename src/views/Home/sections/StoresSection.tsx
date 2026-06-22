"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Store,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SpecialistCard from "../../../components/Cards/SpecialistCard";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./StoresSection.css";
import { getProfessionalsAction } from "@/app/actions/professionals";

export default function StoresSection({
  userProvince = "Buenos Aires",
  userProvinceId
}: {
  userProvince?: string;
  userProvinceId?: number;
}) {
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

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["featured-stores", userProvinceId],
    queryFn: async () => {
      const result = await getProfessionalsAction({
        provinceId: userProvinceId,
        limit: 20,
        sortBy: "rating",
        publicTrade: "true",
      });

      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const storesList = useMemo(() => {
    return stores;
  }, [stores]);

  return (
    <section className="stores-section">
      <div className="home-section-container">
        <div className="stores-section__header">
          <div className="stores-section__title-group">
            <h2 className="stores-section__title">Tiendas Destacadas</h2>
            <p className="section-subtitle">
              Descubrí las mejores tiendas en {userProvince}
            </p>
          </div>
          <button type="button" className="section-link">
            Ver todo <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
        <div className="stores-section__carousel">
          {isLoading ? (
            <div className="stores-section__loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Buscando a las mejores tiendas...</p>
            </div>
          ) : storesList.length === 0 ? (
            <div className="stores-section__empty">
              <Store size={40} className="empty-icon" />
              <h3>Aún no hay tiendas destacadas en {userProvince}</h3>
              <p>Estamos sumando nuevas tiendas a nuestra red.</p>
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
                className="stores-section__scroll"
                onScroll={updateArrowVisibility}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {storesList.map((store) => (
                  <SpecialistCard key={store.id} specialist={store} />
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
