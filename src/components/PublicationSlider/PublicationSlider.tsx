"use client";
import React, { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { getPublicationsAction, Publication } from "@/app/actions/publications";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/routes/paths";
import useCarouselDrag from "@/hooks/useCarouselDrag";
import "./PublicationSlider.css";

interface PublicationSliderProps {
  professionalId?: number;
  provinceId?: number;
}

export default function PublicationSlider({
  professionalId,
  provinceId,
}: PublicationSliderProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".pub-slider__card");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["publications-slider", professionalId, provinceId],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await getPublicationsAction({
          professionalId,
          provinceId,
          page: pageParam,
          limit: 10,
        });
        if (res.serverError) throw new Error(res.serverError);
        return res.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    });

  const publications: Publication[] =
    data?.pages.flatMap((p) => p?.items || []) || [];

  // Solo mostrar las publicaciones que tienen al menos una imagen
  const validPublications = publications.filter(
    (p) => p.publication_images && p.publication_images.length > 0,
  );

  const handleNext = () => {
    scrollCarousel(1);
    if (
      currentIndex >= validPublications.length - 3 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  const handlePrev = () => {
    scrollCarousel(-1);
  };

  const handleScroll = () => {
    updateArrowVisibility();
    const slider = sliderRef.current;
    if (!slider) return;

    const card = slider.querySelector<HTMLElement>(".pub-slider__card");
    const cardWidth = (card?.offsetWidth || 320) + 16;
    const newIndex = Math.round(slider.scrollLeft / cardWidth);
    setCurrentIndex(Math.min(Math.max(0, newIndex), validPublications.length - 1));

    if (
      slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 300 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    updateArrowVisibility();
  }, [validPublications.length, updateArrowVisibility]);

  const handleShare = (e: React.MouseEvent, seoPath: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}${ROUTES.publication}/${seoPath}`;
    if (navigator.share) {
      navigator
        .share({
          title: "¡Mirá esta publicación en Sercio!",
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  const handlePublicationClick = (seoPath: string) => {
    if (sliderRef.current?.classList.contains("is-dragging")) {
      return;
    }
    router.push(`${ROUTES.publication}/${seoPath}`);
  };

  if (isLoading) {
    return (
      <div className="pub-slider__loading">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (validPublications.length === 0) {
    return null;
  }

  return (
    <section className="pub-slider">
      <div className="home-section-container">
        <h2 className="pub-slider__section-title">Últimas Publicaciones</h2>
        <div className="pub-slider__container">
          <div className="pub-slider__wrapper">
            {showLeftArrow && (
              <button
                type="button"
                className="pub-slider__btn pub-slider__btn-prev"
                onClick={handlePrev}
                aria-label="Publicación anterior"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div
              className="pub-slider__track"
              ref={sliderRef}
              onScroll={handleScroll}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {validPublications.map((pub) => {
                const images = [...pub.publication_images].sort(
                  (a, b) => a.display_order - b.display_order,
                );
                const mainImage = images[0]?.image_url;

                const professionalName =
                  pub.professional?.companies?.[0]?.name ||
                  pub.professional?.profile?.display_name ||
                  "Profesional";
                const professionalAvatar =
                  pub.professional?.profile?.avatar_url || null;

                return (
                  <article
                    key={pub.id}
                    className="pub-slider__card"
                    onClick={() => handlePublicationClick(pub.seo_path)}
                  >
                    <div className="pub-slider__image-container">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={pub.title}
                          className="pub-slider__main-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="pub-slider__image-placeholder">
                          <ImageIcon size={32} />
                        </div>
                      )}

                      {images.length > 1 && (
                        <div className="pub-slider__image-badge">
                          <ImageIcon size={12} />
                          <span>1/{images.length}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="pub-slider__share-btn"
                        onClick={(e) => handleShare(e, pub.seo_path)}
                        aria-label="Compartir publicación"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    <div className="pub-slider__content">
                      <div className="pub-slider__author">
                        {professionalAvatar ? (
                          <img
                            src={professionalAvatar}
                            alt={professionalName}
                            className="pub-slider__author-avatar"
                          />
                        ) : (
                          <div className="pub-slider__author-avatar-placeholder">
                            {professionalName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="pub-slider__author-name">
                          {professionalName}
                        </span>
                      </div>
                      <h3 className="pub-slider__title">{pub.title}</h3>
                      <p className="pub-slider__desc">{pub.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {showRightArrow && (
              <button
                type="button"
                className="pub-slider__btn pub-slider__btn-next"
                onClick={handleNext}
                aria-label="Siguiente publicación"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <ChevronRight size={24} />
                )}
              </button>
            )}
          </div>

          <div className="pub-slider__indicators">
            <span className="pub-slider__count">
              {currentIndex + 1} de {validPublications.length}
              {hasNextPage ? "+" : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

