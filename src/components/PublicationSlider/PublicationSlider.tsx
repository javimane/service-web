import React, { useState, useEffect } from "react";
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
    if (currentIndex < validPublications.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    // Si estamos llegando al final de la lista válida y hay más páginas, traer más
    if (
      currentIndex >= validPublications.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    currentIndex,
    validPublications.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

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
    return null; // No mostramos nada si no hay publicaciones con imágenes
  }

  const currentPub = validPublications[currentIndex];
  // Sort images by order
  const images = [...currentPub.publication_images].sort(
    (a, b) => a.display_order - b.display_order,
  );
  const mainImage = images[0].image_url;

  const professionalName =
    currentPub.professional?.companies?.[0]?.name ||
    currentPub.professional?.profile?.display_name ||
    "Profesional";
  const professionalAvatar =
    currentPub.professional?.profile?.avatar_url || null;

  return (
    <section className="pub-slider">
      <div className="home-section-container">
        <h2 className="pub-slider__section-title">Últimas Publicaciones</h2>
        <div className="pub-slider__container">
          <div className="pub-slider__wrapper">
            <button
              className="pub-slider__btn pub-slider__btn-prev"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>

            <div
              className="pub-slider__card"
              onClick={() => handlePublicationClick(currentPub.seo_path)}
            >
              <div className="pub-slider__image-container">
                <img
                  src={mainImage}
                  alt={currentPub.title}
                  className="pub-slider__main-image"
                />
                <button
                  className="pub-slider__share-btn"
                  onClick={(e) => handleShare(e, currentPub.seo_path)}
                >
                  <Share2 size={18} />
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
                <h3 className="pub-slider__title">{currentPub.title}</h3>
                <p className="pub-slider__desc">{currentPub.description}</p>
              </div>
            </div>

            <button
              className="pub-slider__btn pub-slider__btn-next"
              onClick={handleNext}
              disabled={
                currentIndex === validPublications.length - 1 && !hasNextPage
              }
            >
              {isFetchingNextPage &&
              currentIndex === validPublications.length - 1 ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </button>
          </div>
          <div className="pub-slider__indicators">
            <span className="pub-slider__count">
              {currentIndex + 1} de {validPublications.length}{" "}
              {hasNextPage ? "+" : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
