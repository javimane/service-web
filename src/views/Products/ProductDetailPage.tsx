"use client";
import { useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Play,
  Maximize,
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

const formatDescription = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  let key = 0;
  lines.forEach((line) => {
    // split the line by '*' (lookahead to keep the asterisk)
    const parts = line.split(/(?=\*)/);
    parts.forEach((part) => {
      if (part.trim()) {
        result.push(
          <span
            key={key++}
            style={{
              display: "block",
              marginTop: part.trim().startsWith("*") ? "4px" : "0",
            }}
          >
            {part}
          </span>,
        );
      }
    });
  });

  return result;
};

export default function ProductDetailPage({
  initialData,
}: { initialData?: any } = {}) {
  const params = useParams<{ seoPath: string | string[] }>();
  const searchParams = useSearchParams();
  const seoPathRaw = params?.seoPath;
  const seoPath = Array.isArray(seoPathRaw)
    ? seoPathRaw.join("/")
    : ((seoPathRaw as string) ?? "");

  // Try to get ID from query param first, then from slug
  const queryId = searchParams?.get("id");
  const id = queryId || extractIdFromSlug(seoPath);

  const router = useRouter();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const videoFrameRef = useRef<HTMLDivElement | null>(null);

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
    initialData: initialData ?? undefined,
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
  const productCategoryId =
    item.category_id || itemAny.Category?.id || itemAny.category?.id;
  const productCategory = itemAny.Category?.name || itemAny.category?.name;
  const productSubcategoryId =
    item.subcategory_id ||
    itemAny.SubCategory?.id ||
    itemAny.subCategory?.id ||
    itemAny.sub_category?.id;
  const productSubcategory =
    itemAny.SubCategory?.name ||
    itemAny.subCategory?.name ||
    itemAny.sub_category?.name;
  const productOrigin = item.is_foreign ? "Externo" : "Local";
  const rawImages: any[] = item.Images || itemAny.images || [];
  const rawVideos: any[] = item.Videos || itemAny.videos || [];

  const mediaItems: Array<{ type: "image" | "video"; url: string; id?: any }> =
    [];

  for (let i = 0; i < rawImages.length; i++) {
    const img = rawImages[i];
    const url = typeof img === "string" ? img : img?.image_url || img?.url;
    if (url) mediaItems.push({ type: "image", url, id: img?.id || `img-${i}` });
  }

  for (let i = 0; i < rawVideos.length; i++) {
    const vid = rawVideos[i];
    const url = typeof vid === "string" ? vid : vid?.video_url || vid?.url;
    if (url) mediaItems.push({ type: "video", url, id: vid?.id || `vid-${i}` });
  }

  // Get seller info from the first ProfessionalProducts entry (Direct access without .map())
  const professionalProduct = item.ProfessionalProducts?.[0];
  const productLink = professionalProduct?.link_url;
  const professional = professionalProduct?.Professional;
  const professionalAny = professional as any;

  const profile = professionalAny?.Profile || professionalAny?.profile;
  const avatarUrl = profile?.avatar_url || null;
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

  const isWholesale =
    professionalProduct?.wholesale === true || item.wholesale === true;
  const wholesalePrice =
    professionalProduct?.wholesale_price || item.wholesale_price;
  const wholesaleUnit =
    professionalProduct?.wholesale_unit || item.wholesale_unit;

  const handleContact = () => {
    const productUrl = window.location.href;
    const msg = `Hola, qué tal, pregunto por el producto: ${productName} - ${productUrl}`;
    const encodedMsg = encodeURIComponent(msg);
    router.push(
      `/mensajes?professionalId=${professionalId}&initialMessage=${encodedMsg}`,
    );
  };

  const nextImage = () => {
    if (!mediaItems.length) return;
    setActiveImageIdx((prev) => (prev + 1) % mediaItems.length);
  };

  const prevImage = () => {
    if (!mediaItems.length) return;
    setActiveImageIdx(
      (prev) => (prev - 1 + mediaItems.length) % mediaItems.length,
    );
  };

  const currentMedia = mediaItems[activeImageIdx];

  const handleFullscreenVideo = async () => {
    const container = videoFrameRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (container.requestFullscreen) {
        await container.requestFullscreen();
        return;
      }

      const webkitContainer = container as HTMLDivElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (webkitContainer.webkitRequestFullscreen) {
        await webkitContainer.webkitRequestFullscreen();
      }
    } catch {
      // noop
    }
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
            {(productCategory || productSubcategory) && (
              <nav
                className="product-detail__breadcrumbs"
                aria-label="Ruta de categoría"
              >
                <Link
                  href="/productos"
                  className="product-detail__breadcrumb-link"
                >
                  Productos
                </Link>
                {productCategory && (
                  <>
                    <ChevronRight
                      size={14}
                      className="product-detail__breadcrumb-separator"
                    />
                    <Link
                      href={`/productos?category=${productCategoryId || encodeURIComponent(productCategory)}`}
                      className="product-detail__breadcrumb-link"
                    >
                      {productCategory}
                    </Link>
                  </>
                )}
                {productSubcategory && (
                  <>
                    <ChevronRight
                      size={14}
                      className="product-detail__breadcrumb-separator"
                    />
                    <Link
                      href={`/productos?category=${productCategoryId || encodeURIComponent(productCategory)}&subcategory=${productSubcategoryId || encodeURIComponent(productSubcategory)}`}
                      className="product-detail__breadcrumb-link product-detail__breadcrumb-link--active"
                    >
                      {productSubcategory}
                    </Link>
                  </>
                )}
              </nav>
            )}

            <div className="product-detail__gallery">
              <div
                ref={videoFrameRef}
                className={`product-detail__main-image-container ${currentMedia?.type === "video" ? "product-detail__main-image-container--video" : "product-detail__main-image-container--image"}`}
              >
                {currentMedia ? (
                  currentMedia.type === "video" ? (
                    <>
                      <video
                        key={currentMedia.url}
                        src={currentMedia.url}
                        controls
                        controlsList="nofullscreen nodownload noplaybackrate noremoteplayback"
                        disablePictureInPicture
                        disableRemotePlayback
                        playsInline
                        autoPlay
                        muted
                        loop
                        className="product-detail__main-video"
                        onDoubleClick={(event) => {
                          event.preventDefault();
                          handleFullscreenVideo();
                        }}
                      />
                      <button
                        type="button"
                        className="product-detail__fullscreen-btn"
                        onClick={handleFullscreenVideo}
                        aria-label="Ver video en pantalla completa"
                      >
                        <Maximize size={16} />
                        Pantalla completa
                      </button>
                    </>
                  ) : (
                    <img src={currentMedia.url} alt={productName} />
                  )
                ) : (
                  <div className="no-image-placeholder">
                    No hay contenido multimedia disponible
                  </div>
                )}

                {mediaItems.length > 1 && (
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

              {mediaItems.length > 1 && (
                <div className="product-detail__thumbnails">
                  {mediaItems.map((item, idx: number) => (
                    <button
                      key={item.id || idx}
                      className={`thumbnail-btn ${idx === activeImageIdx ? "active" : ""} ${item.type === "video" ? "thumbnail-btn--video" : ""}`}
                      onClick={() => setActiveImageIdx(idx)}
                    >
                      {item.type === "video" ? (
                        <div className="thumbnail-video-wrapper">
                          <video src={item.url} preload="metadata" />
                          <div className="thumbnail-video-overlay">
                            <Play size={16} fill="currentColor" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={`${productName} thumbnail ${idx}`}
                        />
                      )}
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
                  <span className="fact-label">EAN</span>
                  <span className="fact-value">
                    {productEan || "No informado"}
                  </span>
                </div>
                {(item.weight || item.width || item.height || item.depth) && (
                  <div className="product-detail__fact-row">
                    <span className="fact-label">Dimensiones</span>
                    <span className="fact-value">
                      {item.weight ? `${item.weight}kg ` : ""}
                      {item.width && item.height && item.depth
                        ? `(${item.width}x${item.height}x${item.depth} cm)`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {productDescription && (
              <div className="product-detail__description-container">
                <h3>Descripción</h3>
                <div
                  className="product-detail__description"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {formatDescription(productDescription)}
                </div>
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
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={sellerName}
                        className="seller-avatar"
                      />
                    ) : (
                      <ShieldCheck size={18} className="seller-icon" />
                    )}
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
                      {(() => {
                        const finalPrice = offerPrice
                          ? offerPrice
                          : originalPrice;
                        const isConsult =
                          !finalPrice || Number(finalPrice) <= 1;

                        if (isConsult) {
                          return (
                            <div className="seller-current-price-row">
                              <span className="seller-price">Consultar</span>
                            </div>
                          );
                        }

                        return (
                          <>
                            {hasDiscount && originalPrice > 1 && (
                              <span className="seller-original-price">
                                {currencySymbol}
                                {formatPrice(originalPrice)}
                              </span>
                            )}
                            <div className="seller-current-price-row">
                              <span className="seller-price">
                                {currencySymbol}
                                {formatPrice(finalPrice)}
                              </span>
                              {discountVal > 0 && originalPrice > 1 && (
                                <span className="seller-discount">
                                  {discountVal}% OFF
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()}

                      {isWholesale && (
                        <div
                          className="seller-current-price-row"
                          style={{
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "4px",
                            marginTop: "12px",
                            borderTop: "1px dashed var(--border-color)",
                            paddingTop: "12px",
                          }}
                        >
                          <span
                            className="seller-discount"
                            style={{
                              alignSelf: "flex-start",
                              backgroundColor: "var(--accent-color)",
                            }}
                          >
                            POR MAYOR
                          </span>
                          <span
                            className="seller-price"
                            style={{ fontSize: "var(--text-md)" }}
                          >
                            {currencySymbol}
                            {formatPrice(wholesalePrice)}{" "}
                            <span
                              style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: "var(--weight-normal)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              c/u
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--text-secondary)",
                              fontWeight: "var(--weight-medium)",
                            }}
                          >
                            Mínimo: {wholesaleUnit} unidades
                          </span>
                        </div>
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
