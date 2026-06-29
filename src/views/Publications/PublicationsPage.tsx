"use client";

import React, { useState, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  Share2,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { ROUTES } from "@/routes/paths";
import { getPublicationsAction, Publication } from "@/app/actions/publications";
import { getProvincesAction } from "@/app/actions/provinces";
import "./PublicationsPage.css";

export default function PublicationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const res = await getProvincesAction();
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data || [];
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["all-publications", debouncedSearchTerm, selectedProvince],
    queryFn: async ({ pageParam = 1 }) => {
      const activeFilters: any = {
        title: debouncedSearchTerm || undefined,
        limit: 12,
        page: pageParam,
      };

      if (selectedProvince) activeFilters.provinceId = Number(selectedProvince);

      const res = await getPublicationsAction(activeFilters);
      if (res.serverError) throw new Error(res.serverError);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
  });

  const publications: Publication[] =
    data?.pages.flatMap((p) => p?.items || []) || [];

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

  return (
    <div className="pubs-page-wrapper">
      <Navbar />
      <main className="pubs-page">
        <div className="container pubs-page__container">
          <header className="pubs-page__header">
            <div>
              <h1 className="pubs-page__title">Publicaciones</h1>
              <p className="pubs-page__subtitle">
                Descubrí las últimas novedades de nuestros profesionales
              </p>
            </div>
            <button
              className="pubs-page__refresh-btn"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                size={20}
                className={isRefetching ? "animate-spin" : ""}
              />
              <span>Actualizar</span>
            </button>
          </header>

          <div className="pubs-page__search-section">
            <div className="pubs-page__search-bar">
              <Search size={20} className="pubs-page__search-icon" />
              <input
                type="text"
                placeholder="Buscar publicación por título..."
                className="pubs-page__search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pubs-page__province-filter">
              <select
                className="pubs-page__select"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Todas las provincias</option>
                {provinces.map((prov: any) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pubs-page__content">
            {isLoading ? (
              <div className="pubs-page__loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Cargando publicaciones...</p>
              </div>
            ) : publications.length === 0 ? (
              <div className="pubs-page__empty">
                <ImageIcon size={48} className="pubs-page__empty-icon" />
                <h3>No se encontraron publicaciones</h3>
                <p>Intentá ajustando la búsqueda.</p>
              </div>
            ) : (
              <div className="pubs-page__list">
                {publications.map((pub: Publication) => {
                  const professionalName =
                    pub.professional?.companies?.[0]?.name ||
                    pub.professional?.profile?.display_name ||
                    "Profesional";
                  const professionalAvatar =
                    pub.professional?.profile?.avatar_url || null;
                  const images = [...(pub.publication_images || [])].sort(
                    (a, b) => a.display_order - b.display_order,
                  );
                  const mainImage =
                    images.length > 0 ? images[0].image_url : null;

                  return (
                    <div
                      key={pub.id}
                      className="pub-card"
                      onClick={() => handlePublicationClick(pub.seo_path)}
                    >
                      {mainImage ? (
                        <div className="pub-card__image-container">
                          <img
                            src={mainImage}
                            alt={pub.title}
                            className="pub-card__image"
                          />
                        </div>
                      ) : (
                        <div className="pub-card__image-container pub-card__image-placeholder">
                          <ImageIcon size={40} />
                        </div>
                      )}

                      <div className="pub-card__body">
                        <div className="pub-card__header">
                          <h2 className="pub-card__title">{pub.title}</h2>
                          <button
                            className="pub-card__share-btn"
                            onClick={(e) => handleShare(e, pub.seo_path)}
                            aria-label="Compartir publicación"
                          >
                            <Share2 size={18} />
                          </button>
                        </div>

                        <p className="pub-card__description">
                          {pub.description}
                        </p>

                        <div className="pub-card__footer">
                          <div className="pub-card__author">
                            {professionalAvatar ? (
                              <img
                                src={professionalAvatar}
                                alt={professionalName}
                                className="pub-card__avatar"
                              />
                            ) : (
                              <div className="pub-card__avatar-placeholder">
                                {professionalName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="pub-card__author-name">
                              {professionalName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasNextPage && (
              <div className="pubs-page__load-more">
                <button
                  className="btn-primary"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Cargando...
                    </>
                  ) : (
                    "Cargar más"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
