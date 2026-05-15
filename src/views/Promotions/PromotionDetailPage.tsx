"use client";
import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Tag,
  User,
  Loader2,
  MessageCircle,
  Ticket,
} from "lucide-react";
import { getProfessionalPromotionDetailAction } from "../../app/actions/professionalPromotions";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import "./PromotionDetailPage.css";

export default function PromotionDetailPage({
  promotionId,
}: {
  promotionId?: string;
}) {
  const params = useParams<{ seoPath: string | string[] }>();
  const seoPathRaw = params?.seoPath;
  const searchParams = useSearchParams();
  const idFromQuery = searchParams?.get("id") ?? null;
  const router = useRouter();

  const idFromPath = Array.isArray(seoPathRaw)
    ? seoPathRaw[seoPathRaw.length - 1]
    : extractIdFromSlug(seoPathRaw as string);

  const id = promotionId ? String(promotionId) : idFromQuery || idFromPath;

  const {
    data: promotion,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["promotion", id],
    queryFn: async () => {
      const result = await getProfessionalPromotionDetailAction({ id: id! });
      return result?.data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  // URL Normalization disabled - using query params approach instead
  // The URL pattern /promociones/{slug}?id={id} is maintained by PromotionsPage
  // useEffect(() => {
  //   if (!promotionId && promotion?.seo_path) {
  //     const currentPath = window.location.pathname;
  //     const slug = promotion.seo_path;
  //     const targetPath = slug.startsWith("/")
  //       ? slug.replace("/promotions/", "/promociones/")
  //       : `/promociones/${slug}`;
  //
  //     if (currentPath !== targetPath) {
  //       router.replace(targetPath);
  //     }
  //   }
  // }, [promotion, router, promotionId, seoPath]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="promotion-detail-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Cargando promoci&#243;n...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !promotion) {
    return (
      <>
        <Navbar />
        <div className="promotion-detail-error">
          <h2>Promoci&#243;n no encontrada</h2>
          <p>
            La promoci&#243;n que buscas no existe o no est&#225; disponible.
          </p>
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft size={18} />
            Volver
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const professional = promotion.Professional as any;
  const companyName =
    professional?.Company?.[0]?.name ||
    professional?.Company?.name ||
    professional?.Profile?.display_name ||
    "Profesional";
  const avatarUrl = professional?.Profile?.avatar_url;

  const offerLabel =
    promotion.discount_type === "2x1"
      ? "2x1"
      : promotion.discount_type === "percentage" ||
          promotion.discount_type === "Percentage"
        ? `${promotion.discount_value}% OFF`
        : promotion.discount_type === "fixed" ||
            promotion.discount_type === "Fixed Amount"
          ? `$${promotion.discount_value} OFF`
          : String(promotion.discount_value);

  const fromDate = promotion.from_date
    ? new Date(promotion.from_date).toLocaleDateString("es-AR")
    : null;

  const expiryDate = promotion.expires_at
    ? new Date(promotion.expires_at).toLocaleDateString("es-AR")
    : null;

  return (
    <>
      <SEO
        title={`${promotion.title} - Promoci&#243;n`}
        description={
          promotion.description || "Encontr&#225; esta promoci&#243;n especial."
        }
      />
      <Navbar />

      <main className="promotion-detail-page">
        <button
          onClick={() => router.back()}
          className="promotion-detail__back-btn"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="promotion-detail__card">
          <div className="promotion-detail__image-container">
            <img
              src={
                promotion.image_url ||
                "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800"
              }
              alt={promotion.title}
              className="promotion-detail__image"
            />
            <div className="promotion-detail__badge">
              <Ticket size={16} className="promotion-detail__badge-icon" />
              <span>{offerLabel}</span>
            </div>
          </div>

          <div className="promotion-detail__content">
            <div className="promotion-detail__professional">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={companyName}
                  className="promotion-detail__avatar"
                />
              ) : (
                <div className="promotion-detail__avatar-placeholder">
                  <User size={22} />
                </div>
              )}
              <div>
                <p className="promotion-detail__company-name">{companyName}</p>
                <button
                  onClick={() =>
                    router.push(
                      getProfilePath(
                        promotion.professional_id,
                        promotion.seo_path,
                      ),
                    )
                  }
                  className="promotion-detail__profile-link"
                >
                  Ver perfil completo
                </button>
              </div>
            </div>

            <h1 className="promotion-detail__title">{promotion.title}</h1>

            {promotion.description && (
              <p className="promotion-detail__description">
                {promotion.description}
              </p>
            )}

            <div className="promotion-detail__meta">
              {fromDate && (
                <div className="promotion-detail__meta-item">
                  <Calendar size={16} />
                  <span>
                    <strong>V&#225;lido desde:</strong> {fromDate}
                  </span>
                </div>
              )}
              {expiryDate && (
                <div className="promotion-detail__meta-item">
                  <Calendar size={16} />
                  <span>
                    <strong>V&#225;lido hasta:</strong> {expiryDate}
                  </span>
                </div>
              )}
              {promotion.discount_type && (
                <div className="promotion-detail__meta-item">
                  <Tag size={16} />
                  <span>
                    <strong>Descuento:</strong>{" "}
                    {promotion.discount_type === "percentage" ||
                    promotion.discount_type === "Percentage"
                      ? "Porcentaje"
                      : promotion.discount_type === "fixed" ||
                          promotion.discount_type === "Fixed Amount"
                        ? "Monto Fijo"
                        : promotion.discount_type === "2x1"
                          ? "2x1"
                          : "Env&#237;o Gratis"}
                  </span>
                </div>
              )}
            </div>

            <div className="promotion-detail__actions">
              <button
                className="promotion-detail__btn promotion-detail__btn--primary"
                onClick={() =>
                  router.push(`/messages?to=${promotion.professional_id}`)
                }
              >
                <MessageCircle size={18} />
                Contactar
              </button>
              <button
                className="promotion-detail__btn promotion-detail__btn--secondary"
                onClick={() =>
                  router.push(
                    getProfilePath(
                      promotion.professional_id,
                      promotion.seo_path,
                    ),
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
