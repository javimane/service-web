"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  MapPin,
  Star,
  MessageCircle,
  User,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { getServiceDetailAction } from "../../app/actions/services";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import "./ServiceDetailPage.css";

export default function ServiceDetailPage() {
  const params = useParams<{ seoPath: string }>();
  const searchParams = useSearchParams();
  const seoPath = params?.seoPath as string;

  // Try to get ID from query param first, then from slug
  const queryId = searchParams?.get("id");
  const id = queryId || extractIdFromSlug(seoPath);
  const router = useRouter();

  const {
    data: service,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["service", seoPath, id],
    queryFn: async () => {
      const result = await getServiceDetailAction({ id: id! });
      return result?.data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  // URL Normalization disabled - using query params approach instead
  // The URL pattern /servicios/{slug}?id={id} is maintained by ServicesPage
  // useEffect(() => {
  //   if (service?.seo_path) {
  //     const currentPath = window.location.pathname;
  //     const targetPath = normalizeSeoPath(service.seo_path, "/servicios", id);
  //
  //     if (currentPath !== targetPath) {
  //       router.replace(targetPath);
  //     }
  //   }
  // }, [service, router, id]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="service-detail-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Cargando servicio...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <Navbar />
        <div className="service-detail-error">
          <h2>Servicio no encontrado</h2>
          <p>El servicio que buscas no existe o no está disponible.</p>
          <button
            onClick={() => router.push("/servicios")}
            className="back-btn"
          >
            <ArrowLeft size={18} />
            Volver al Catálogo
          </button>
        </div>
        <Footer />
      </>
    );
  }

  // API returns lowercase keys; type definitions use PascalCase — handle both
  const svc = service as any;
  const professional = svc.professional || svc.Professional;
  const profile = professional?.profile || professional?.Profile;
  const company = professional?.companies?.[0] || professional?.Company;
  const professionalName =
    company?.name || profile?.display_name || "Profesional";
  const avatar =
    profile?.avatar_url ||
    profile?.portfolio_image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(professionalName)}&background=random`;
  const address = professional?.address?.[0] || professional?.Address;
  const locationName = address?.province?.name || address?.Province?.name;
  const rating = professional?.rating_avg || 0;
  const isVerified =
    company?.companies_arca?.[0]?.is_verified ||
    company?.CompanyArca?.[0]?.is_verified ||
    false;
  const price = service.base_price
    ? `$${service.base_price.toLocaleString("es-AR")}`
    : "Consultar";

  const professionalId = service.professional_id || professional?.id || "";

  const handleContact = () => {
    const serviceUrl = window.location.href;
    const msg = `Hola, qué tal, pregunto por el servicio: ${service.name} - ${serviceUrl}`;
    const encodedMsg = encodeURIComponent(msg);
    router.push(`/mensajes?professionalId=${professionalId}&initialMessage=${encodedMsg}`);
  };

  return (
    <>
      <SEO
        title={`${service.name} - Servicios Profesionales`}
        description={service.description || "Conocé este servicio profesional."}
      />
      <Navbar />

      <main className="service-detail-page">
        <button
          onClick={() => router.back()}
          className="service-detail__back-btn"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="service-detail__layout">
          {/* Professional Card */}
          <div className="service-detail__card">
            <div className="service-detail__professional-hero">
              <img
                src={avatar}
                alt={professionalName}
                className="service-detail__avatar"
              />
              <div className="service-detail__professional-info">
                <p className="service-detail__professional-name">
                  {isVerified && (
                    <CheckCircle
                      size={18}
                      className="service-detail__verified-icon"
                    />
                  )}
                  {professionalName}
                </p>
                <span className="service-detail__location">
                  <MapPin size={16} />
                  {locationName}
                </span>
                {rating > 0 && (
                  <span className="service-detail__rating">
                    <Star
                      size={16}
                      fill="var(--primary-color, #e94823)"
                      color="var(--primary-color, #e94823)"
                    />
                    {Number(rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="service-detail__body">
              <h1 className="service-detail__title-large">{service.name}</h1>

              <div className="service-detail__section">
                <h2 className="service-detail__section-title">Descripción</h2>
                <p className="service-detail__desc">
                  {service.description || "Sin descripción disponible."}
                </p>
              </div>

              <div className="service-detail__section">
                <h2 className="service-detail__section-title">Precio</h2>
                <p className="service-detail__price-large">{price}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="service-detail__footer">
              <button
                className="service-detail__button service-detail__button--primary"
                onClick={handleContact}
              >
                <MessageCircle size={18} />
                Contactar
              </button>
              <button
                className="service-detail__button service-detail__button--secondary"
                onClick={() =>
                  router.push(
                    getProfilePath(professionalId!, professional?.seo_path),
                  )
                }
              >
                <User size={18} />
                Ver Perfil
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
