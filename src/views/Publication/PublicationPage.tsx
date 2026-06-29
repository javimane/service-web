"use client";
import React, { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Share2, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { ROUTES } from "@/routes/paths";
import { getPublicationsAction, Publication } from "@/app/actions/publications";
import "./PublicationPage.css";
import Link from "next/link";

interface PublicationPageProps {
  publication: Publication;
}

export default function PublicationPage({ publication }: PublicationPageProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images =
    publication.publication_images && publication.publication_images.length > 0
      ? [...publication.publication_images].sort(
          (a, b) => a.display_order - b.display_order,
        )
      : [];

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const professionalName =
    publication.professional?.companies?.[0]?.name ||
    publication.professional?.profile?.display_name ||
    "Profesional";
  const professionalAvatar =
    publication.professional?.profile?.avatar_url || null;
  const professionalSeoPath = publication.professional?.seo_path || "";

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: publication.title,
          text: publication.description,
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  const formattedDate = publication.created_at
    ? new Date(publication.created_at).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="pub-page">
      <Navbar />

      <main className="pub-page__main">
        <div className="pub-page__container">
          <button onClick={() => router.back()} className="pub-page__back">
            <ChevronLeft size={20} /> Volver
          </button>

          <article className="pub-page__content">
            <header className="pub-page__header">
              <h1 className="pub-page__title">{publication.title}</h1>

              <div className="pub-page__meta">
                <Link
                  href={
                    professionalSeoPath
                      ? `${ROUTES.profile}/${professionalSeoPath}`
                      : "#"
                  }
                  className="pub-page__author"
                >
                  {professionalAvatar ? (
                    <img
                      src={professionalAvatar}
                      alt={professionalName}
                      className="pub-page__author-avatar"
                    />
                  ) : (
                    <div className="pub-page__author-avatar-placeholder">
                      {professionalName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="pub-page__author-name">
                    {professionalName}
                  </span>
                </Link>

                {formattedDate && (
                  <div className="pub-page__date">
                    <Calendar size={16} />
                    <span>{formattedDate}</span>
                  </div>
                )}

                <button className="pub-page__share-btn" onClick={handleShare}>
                  <Share2 size={18} /> Compartir
                </button>
              </div>
            </header>

            {images.length > 0 && (
              <div className="pub-page__slider-container">
                <img
                  src={images[currentImageIndex].image_url}
                  alt={publication.title}
                  className="pub-page__main-image"
                />

                {images.length > 1 && (
                  <>
                    <button
                      className="pub-page__slider-btn pub-page__slider-btn--prev"
                      onClick={handlePrevImage}
                      disabled={currentImageIndex === 0}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      className="pub-page__slider-btn pub-page__slider-btn--next"
                      onClick={handleNextImage}
                      disabled={currentImageIndex === images.length - 1}
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="pub-page__slider-dots">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          className={`pub-page__slider-dot ${idx === currentImageIndex ? "active" : ""}`}
                          onClick={() => setCurrentImageIndex(idx)}
                          aria-label={`Ir a la imagen ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pub-page__body">
              <p>{publication.description}</p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
