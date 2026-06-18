"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  MapPin,
  MessageCircle,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { getProductDetailAction } from "../../app/actions/products";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import "./ProductDetailPage.css";

function formatPrice(n: number | null | undefined) {
  if (!n) return "0";
  return Number(n).toLocaleString("es-AR");
}

export default function ProductDetailPage() {
  const params = useParams<{ seoPath: string | string[] }>();
  const searchParams = useSearchParams();
  const seoPath = params?.seoPath;

  // Try to get ID from query param first, then from slug
  const queryId = searchParams?.get("id");
  const id = queryId || extractIdFromSlug(seoPath);

  const router = useRouter();
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const {
    data: item,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", seoPath, id],
    queryFn: async () => {
      const result = await getProductDetailAction({ id: id! });
      return result?.data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  // URL Normalization disabled - using query params approach instead
  // The URL pattern /productos/{slug}?id={id} is maintained by ProductsPage
  // useEffect(() => {
  //   if (item?.seo_path) {
  //     const currentPath = window.location.pathname;
  //     const targetPath = normalizeSeoPath(item.seo_path, "/productos", id);
  //
  //     if (currentPath !== targetPath) {
  //       router.replace(targetPath);
  //     }
  //   }
  // }, [item, router, id, seoPath]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="product-detail-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Cargando producto...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Navbar />
        <div className="product-detail-error">
          <h2>Producto no encontrado</h2>
          <p>El producto que buscas no existe o no está disponible.</p>
          <button
            onClick={() => router.push("/productos")}
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

  // Data mapping based on API response provided by user
  const itemAny = item as any;
  const productName = item.name ?? "Producto";
  const productDescription = item.description;
  const productBrand = item.brand;
  const productEan = item.ean;
  const productCategory = itemAny.Category?.name;
  const productOrigin = item.is_foreign ? "Externo" : "Local";
  const productImages = item.Images || [];

  // Get seller info from the first ProfessionalProducts entry
  const professionalProduct = item.ProfessionalProducts?.[0];
  const productLink = professionalProduct?.link_url; // Added link_url extraction
  const professional = professionalProduct?.Professional;
  const professionalAny = professional as any;

  const profile = professionalAny?.Profile || professionalAny?.profile;
  const companyData =
    professionalAny?.Company ||
    professionalAny?.Companies ||
    professionalAny?.company ||
    professionalAny?.companies;
  const company = Array.isArray(companyData) ? companyData[0] : companyData;
  const sellerName =
    company?.name || profile?.display_name || "Profesional independiente";

  const addressData = professionalAny?.Address || professionalAny?.address;
  const address = Array.isArray(addressData) ? addressData[0] : addressData;
  const sellerProvince =
    address?.Province?.name ||
    address?.province?.name ||
    "Ubicación no especificada";

  const professionalId =
    professional?.id ??
    professionalProduct?.professional_id ??
    item?.ProfessionalProducts?.[0]?.professional_id;
  const userId = professional?.user_id ?? professionalId;

  // Price logic
  const originalPrice = professionalProduct?.price || item.price;
  const offerPrice = professionalProduct?.offer_price;
  const currencyCode =
    professionalProduct?.currency_code ||
    item.currency_code ||
    itemAny.Product?.currency_code ||
    "ARG";
  const percentDiscount =
    professionalProduct?.percent_discount ||
    item.percent_discount ||
    itemAny.Product?.percent_discount ||
    0;
  const hasDiscount = !!offerPrice || percentDiscount > 0;
  const discountVal =
    percentDiscount > 0
      ? percentDiscount
      : offerPrice && originalPrice
        ? Math.round((1 - offerPrice / originalPrice) * 100)
        : 0;
  const currencySymbol = currencyCode === "USD" ? "USD $" : "$";

  const isWholesale = professionalProduct?.wholesale === true || item.wholesale === true;
  const wholesalePrice = professionalProduct?.wholesale_price || item.wholesale_price;
  const wholesaleUnit = professionalProduct?.wholesale_unit || item.wholesale_unit;

  const handleContact = () => {
    const productUrl = window.location.href;
    const msg = `Hola, qué tal, pregunto por el producto: ${productName} - ${productUrl}`;
    const encodedMsg = encodeURIComponent(msg);
    router.push(
      `/mensajes?professionalId=${professionalId}&initialMessage=${encodedMsg}`,
    );
  };

  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setActiveImageIdx(
      (prev) => (prev - 1 + productImages.length) % productImages.length,
    );
  };

  return (
    <>
      <SEO
        title={`${productName} - Catálogo de Productos`}
        description={
          productDescription ||
          "Conocé este producto en nuestro catálogo completo."
        }
      />
      <Navbar />

      <main className="product-detail-page">
        <button
          onClick={() => router.back()}
          className="product-detail__back-btn"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="product-detail__layout">
          {/* Left Column: Image + Details */}
          <div className="product-detail__left-column">
            <div className="product-detail__gallery">
              <div className="product-detail__main-image-container">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[activeImageIdx]?.image_url}
                    alt={productName}
                  />
                ) : (
                  <div className="no-image-placeholder">
                    No hay imágenes disponibles
                  </div>
                )}

                {productImages.length > 1 && (
                  <div className="gallery-nav">
                    <button onClick={prevImage} className="gallery-nav-btn">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} className="gallery-nav-btn">
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </div>

              {productImages.length > 1 && (
                <div className="product-detail__thumbnails">
                  {productImages.map((img: any, idx: number) => (
                    <button
                      key={img.id || idx}
                      className={`thumbnail-btn ${idx === activeImageIdx ? "active" : ""}`}
                      onClick={() => setActiveImageIdx(idx)}
                    >
                      <img
                        src={img.image_url}
                        alt={`${productName} thumbnail ${idx}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-detail__info-header">
              <div className="product-detail__meta-pills">
                <span className="product-meta-pill product-meta-pill--soft">
                  Producto
                </span>
                <span className="product-meta-pill">{productOrigin}</span>
              </div>
              <h1 className="product-detail__title">{productName}</h1>

              <div className="product-detail__facts">
                <div className="product-detail__fact-row">
                  <span className="fact-label">Marca</span>
                  <span className="fact-value">
                    {productBrand || "Sin marca"}
                  </span>
                </div>
                <div className="product-detail__fact-row">
                  <span className="fact-label">Categoria</span>
                  <span className="fact-value">
                    {productCategory || "General"}
                  </span>
                </div>
                <div className="product-detail__fact-row">
                  <span className="fact-label">EAN</span>
                  <span className="fact-value">
                    {productEan || "No informado"}
                  </span>
                </div>
              </div>
            </div>

            {productDescription && (
              <div className="product-detail__description-container">
                <h3>Descripción</h3>
                <p className="product-detail__description">
                  {productDescription}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Seller Info */}
          <div className="product-detail__right-column">
            <div className="product-detail__sellers-container">
              <h2 className="sellers-title">Vendido por</h2>

              <div className="sellers-list">
                <div className="seller-card">
                  <div className="seller-card__header">
                    <ShieldCheck size={18} className="seller-icon" />
                    <div className="seller-card__info">
                      <button
                        onClick={() =>
                          router.push(
                            getProfilePath(userId!, professional?.seo_path),
                          )
                        }
                        className="seller-name"
                      >
                        {sellerName}
                      </button>
                    </div>
                  </div>

                  <div className="seller-card__location">
                    <MapPin size={14} />
                    <span>{sellerProvince}</span>
                  </div>

                  <div className="seller-card__price-row">
                    <div className="prices">
                      {isWholesale ? (
                        <div className="seller-current-price-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                          <span className="seller-discount" style={{ alignSelf: "flex-start", backgroundColor: "var(--brand-blue)" }}>
                            Por Mayor
                          </span>
                          <span className="seller-price">
                            {currencySymbol}
                            {formatPrice(wholesalePrice)} <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-normal)", color: "var(--text-secondary)" }}>c/u</span>
                          </span>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
                            Min. {wholesaleUnit} unidades
                          </span>
                        </div>
                      ) : (
                        <>
                          {hasDiscount && (
                            <span className="seller-original-price">
                              {currencySymbol}
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                          <div className="seller-current-price-row">
                            <span className="seller-price">
                              {currencySymbol}
                              {formatPrice(offerPrice ? offerPrice : originalPrice)}
                            </span>
                            {discountVal > 0 && (
                              <span className="seller-discount">
                                {discountVal}% OFF
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      className="seller-contact-btn"
                      onClick={handleContact}
                    >
                      <MessageCircle size={16} />
                      Contactar
                    </button>
                  </div>

                  {productLink && (
                    <a
                      href={
                        productLink.startsWith("http")
                          ? productLink
                          : `https://${productLink}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="seller-contact-btn seller-contact-btn--link"
                    >
                      <ExternalLink size={16} />
                      Ver en sitio web
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
