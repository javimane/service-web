"use client";
import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
  Percent,
  Tag,
  Share2,
} from "lucide-react";
import { type BankPromotion } from "../../services/bankPromotionService";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import "./BankPromotionDetailPage.css";
import { getBankPromotionDetailAction } from "../../app/actions/bankPromotions";
import { useAlert } from "../../context/AlertContext";

const DAYS_ES: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

function getActiveDays(promo: BankPromotion): string[] {
  return Object.keys(DAYS_ES).filter(
    (day) => promo[day as keyof BankPromotion],
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPaymentMethods(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(
      (method): method is string => typeof method === "string",
    );
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (method): method is string => typeof method === "string",
          );
        }
      } catch {
        // If JSON parsing fails, fallback to raw value below.
      }
    }

    return trimmed ? [trimmed] : [];
  }

  return [];
}

export default function BankPromotionDetailPage() {
  const params = useParams<{ seoPath: string | string[] }>();
  const searchParams = useSearchParams();
  const seoPathRaw = params?.seoPath;

  // Try to get ID from query param first, then from slug
  const queryId = searchParams?.get("id");
  const idFromPath = Array.isArray(seoPathRaw)
    ? seoPathRaw[seoPathRaw.length - 1]
    : extractIdFromSlug(seoPathRaw as string);
  const id = queryId || idFromPath;
  const router = useRouter();
  const { showSuccess } = useAlert();

  const {
    data: promo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bank-promotion", seoPathRaw, id],
    queryFn: async () => {
      const result = await getBankPromotionDetailAction({ id: id! });
      return result?.data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60,
  });

  // URL Normalization disabled - using query params approach instead
  // The URL pattern /promociones-bancarias/{slug}?id={id} is maintained by PromotionsPage
  // useEffect(() => {
  //   if (promo?.seo_path) {
  //     const currentPath = window.location.pathname;
  //     const slug = promo.seo_path;
  //     const targetPath = slug.startsWith("/")
  //       ? slug.replace("/promotions/", "/promociones-bancarias/")
  //       : `/promociones-bancarias/${slug}`;
  //     if (currentPath !== targetPath) {
  //       router.replace(targetPath);
  //     }
  //   }
  // }, [promo, router, seoPath]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="bank-promo-detail-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Cargando promoción...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !promo) {
    return (
      <>
        <Navbar />
        <div className="bank-promo-detail-error">
          <h2>Promoción no encontrada</h2>
          <p>
            La promoción bancaria que buscas no existe o no está disponible.
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

  const professional = promo.Professional;
  const companyName = professional?.Company?.[0]?.name ?? "Comercio";
  const activeDays = getActiveDays(promo);
  const banks =
    promo.bank_promotions_banks?.map((b) => b.Bank?.name).filter(Boolean) ??
    (promo.Bank ? [promo.Bank.name] : []);
  const paymentMethods = getPaymentMethods((promo as any).payment_method);

  const handleShare = () => {
    if (!promo) return;
    const slug = promo.seo_path || "";
    const cleanSeo = slug
      ? slug.startsWith("/")
        ? slug.replace("/promotions/", "/promociones-bancarias/")
        : `/promociones-bancarias/${slug}`
      : `/promociones-bancarias/${promo.id}`;
    const shareUrl = `${window.location.origin}${cleanSeo}`;

    if (navigator.share) {
      navigator
        .share({
          title: companyName || "Promoción Bancaria en Sercio",
          text: promo.description || "Mirá esta promoción bancaria en Sercio",
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showSuccess("¡Enlace de compartir copiado al portapapeles!");
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="bank-promo-detail-page">
        <div className="bank-promo-detail-container">
          <button className="back-btn" onClick={() => router.back()}>
            <ArrowLeft size={18} />
            Volver
          </button>

          <div className="bank-promo-detail-card">
            <div className="bank-promo-detail-header">
              <span className="bank-promo-badge">
                <CreditCard size={16} />
                Promoción Bancaria
              </span>
              <h1 className="bank-promo-company">{companyName}</h1>
            </div>

            <div className="bank-promo-detail-body">
              {/* Discount Info */}
              <div className="bank-promo-discount-grid">
                {promo.percentaje_discount > 0 && (
                  <div className="bank-promo-stat">
                    <Percent size={20} />
                    <span className="stat-value">
                      {promo.percentaje_discount}%
                    </span>
                    <span className="stat-label">Descuento</span>
                  </div>
                )}
                {promo.refund > 0 && (
                  <div className="bank-promo-stat">
                    <Tag size={20} />
                    <span className="stat-value">${promo.refund}</span>
                    <span className="stat-label">Tope Reintegro</span>
                  </div>
                )}
                {promo.installments != null && promo.installments > 0 && (
                  <div className="bank-promo-stat bank-promo-stat--installments">
                    <CreditCard size={20} />
                    <span className="stat-value stat-value--installments">
                      {promo.installments}
                    </span>
                    <span className="stat-label">Cuotas</span>
                    <span className={`interest-badge ${promo.with_interest === false ? 'interest-badge--no' : 'interest-badge--yes'}`}>
                      {promo.with_interest === false ? 'Sin interés' : 'Con interés'}
                    </span>
                  </div>
                )}
              </div>

              {/* Banks */}
              {banks.length > 0 && (
                <div className="bank-promo-banks">
                  <h3>
                    <CreditCard size={16} />
                    Bancos participantes
                  </h3>
                  <div className="bank-promo-tags">
                    {banks.map((bank, i) => (
                      <span key={i} className="bank-tag">
                        {bank}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {paymentMethods.length > 0 && (
                <div className="bank-promo-payment-methods">
                  <h3>
                    <CreditCard size={16} />
                    Medios de pago
                  </h3>
                  <div className="bank-promo-tags">
                    {paymentMethods.map((method) => (
                      <span key={method} className="payment-method-tag">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Days */}
              {activeDays.length > 0 && (
                <div className="bank-promo-days">
                  <h3>Días de vigencia</h3>
                  <div className="bank-promo-tags">
                    {activeDays.map((day) => (
                      <span key={day} className="day-tag">
                        {DAYS_ES[day]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bank-promo-dates">
                <div className="bank-promo-detail-row">
                  <Calendar size={16} />
                  <span>
                    <strong>Desde:</strong> {formatDate(promo.from_date)}
                  </span>
                </div>
                <div className="bank-promo-detail-row">
                  <Calendar size={16} />
                  <span>
                    <strong>Hasta:</strong> {formatDate(promo.expiration_date)}
                  </span>
                </div>
              </div>

              {/* Minimum Amount */}
              {promo.minimum_amount && (
                <div className="bank-promo-detail-row">
                  <Tag size={16} />
                  <span>
                    <strong>Compra mínima:</strong> $
                    {promo.minimum_amount.toLocaleString("es-AR")}
                  </span>
                </div>
              )}

              {/* Description */}
              {promo.description && (
                <div className="bank-promo-description">
                  <h3>Descripción</h3>
                  <p>{promo.description}</p>
                </div>
              )}

              {/* Terms */}
              {promo.terms_conditions && (
                <div className="bank-promo-terms">
                  <h3>Términos y condiciones</h3>
                  <p>{promo.terms_conditions}</p>
                </div>
              )}

              {/* Actions */}
              <div className="bank-promo-actions">
                {professional && (
                  <button
                    className="bank-promo-profile-btn"
                    onClick={() =>
                      router.push(
                        getProfilePath(
                          professional.id,
                          (professional as any).seo_path,
                        ),
                      )
                    }
                  >
                    Ver perfil del comercio
                  </button>
                )}
                <button
                  type="button"
                  className="bank-promo-share-btn"
                  onClick={handleShare}
                >
                  <Share2 size={18} />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
