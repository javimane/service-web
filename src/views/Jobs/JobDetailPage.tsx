"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getJobByIdAction } from "@/app/actions/jobs";
import { useParams, useRouter } from "next/navigation";
import { ROUTES } from "@/routes/paths";
import { Loader2, Share2, MapPin, ArrowLeft, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import "./JobDetailPage.css";

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      if (!id) throw new Error("ID no proporcionado");
      const res = await getJobByIdAction({ id });
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data;
    },
    enabled: !!id,
  });

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: job?.title || "Empleo en Sercio",
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="job-detail-page__loading">
        <Loader2 size={40} className="animate-spin" />
        <p>Cargando detalles del empleo...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-page__error container">
        <div className="job-detail-page__error-card">
          <h2>No se encontró el empleo</h2>
          <p>Es posible que el empleo haya sido eliminado o no exista.</p>
          <button
            className="btn-primary"
            onClick={() => router.push(ROUTES.jobs)}
          >
            Volver a empleos
          </button>
        </div>
      </div>
    );
  }

  const companyName = job.professional?.companies?.[0]?.name || "Empresa";
  const companyAvatar = job.professional?.profile?.avatar_url || null;
  const timeAgo = formatDistanceToNow(new Date(job.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="job-detail-page-wrapper">
      <Navbar />
      <main className="job-detail-page">
        <div className="container job-detail-page__container">
          <button className="job-detail-page__back-btn" onClick={handleGoBack}>
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>

          <div className="job-detail-page__content">
            <div className="job-detail-page__header-card">
              <div className="job-detail-page__header-top">
                <div className="job-detail-page__company-brand">
                  {companyAvatar ? (
                    <img
                      src={companyAvatar}
                      alt={companyName}
                      className="job-detail-page__company-avatar"
                    />
                  ) : (
                    <div className="job-detail-page__company-placeholder">
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="job-detail-page__company-name">
                      {companyName}
                    </h3>
                    {job.province?.name && (
                      <span className="job-detail-page__location">
                        <MapPin size={14} /> {job.province.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="job-detail-page__share-btn"
                  onClick={handleShare}
                >
                  <Share2 size={20} />
                  <span>Compartir</span>
                </button>
              </div>

              <h1 className="job-detail-page__title">{job.title}</h1>

              <div className="job-detail-page__badges">
                {job.is_remote && (
                  <span className="job-detail-page__badge job-detail-page__badge--remote">
                    Remoto
                  </span>
                )}
                {job.is_in_person && (
                  <span className="job-detail-page__badge job-detail-page__badge--person">
                    Presencial
                  </span>
                )}
                {job.is_hybrid && (
                  <span className="job-detail-page__badge job-detail-page__badge--hybrid">
                    Híbrido
                  </span>
                )}
                {job.is_full_time && (
                  <span className="job-detail-page__badge job-detail-page__badge--time">
                    Full-time
                  </span>
                )}
                {job.is_half_day && (
                  <span className="job-detail-page__badge job-detail-page__badge--time">
                    Part-time
                  </span>
                )}
              </div>

              <div className="job-detail-page__meta">Publicado {timeAgo}</div>
            </div>

            <div className="job-detail-page__main-info">
              {job.description && (
                <section className="job-detail-page__section">
                  <h2>Descripción del puesto</h2>
                  <div className="job-detail-page__text-content">
                    {job.description.split("\n").map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              )}

              {job.requirements && (
                <section className="job-detail-page__section">
                  <h2>Requisitos</h2>
                  <div className="job-detail-page__text-content">
                    {job.requirements.split("\n").map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              )}

              <div className="job-detail-page__cta-section">
                <Building2 size={32} className="job-detail-page__cta-icon" />
                <h3>¿Te interesa este puesto?</h3>
                <p>
                  Comunícate directamente con la empresa o aplica según las
                  instrucciones en la descripción.
                </p>
                {/* Aquí se podría agregar un botón para aplicar o ir al perfil del profesional */}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
