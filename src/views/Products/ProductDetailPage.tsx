"use client";
import { useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  MessageCircle,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  Maximize,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { getProductDetailAction } from "../../app/actions/products";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import {
  commerceService,
  ProductVariant,
} from "../../services/commerceService";
import { useAuth } from "../../context/AuthContext";
import ProductPaymentModal from "./components/ProductPaymentModal";
import ProductInstallmentsModal from "./components/ProductInstallmentsModal";
import FavoriteButton from "../../components/FavoriteButton/FavoriteButton";
import CommentsCarousel from "../../components/CommentsCarousel/CommentsCarousel";
import "./ProductDetailPage.css";

const AGE_RESTRICTED_SUBCATEGORIES = new Set([
  "2d6c30b1-95b8-4a2a-b43f-f9f09e5c507a",
  "fb762aba-7df9-4f6c-b507-651323fab7bb",
  "ea1d5cc2-5ed0-4227-a5e3-0f292d4ec67a",
]);

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
  const { user, isAgeVerified } = useAuth();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const videoFrameRef = useRef<HTMLDivElement | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);

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

  const professionalProductId =
    item?.ProfessionalProducts?.[0]?.id || undefined;

  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["product-variants", professionalProductId],
    queryFn: () =>
      professionalProductId
        ? commerceService.variants(professionalProductId)
        : Promise.resolve([]),
    enabled: !!professionalProductId,
    staleTime: 1000 * 60 * 5,
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

  const isAgeRestricted = Boolean(
    productSubcategoryId &&
    AGE_RESTRICTED_SUBCATEGORIES.has(
      String(productSubcategoryId).toLowerCase(),
    ),
  );
  const canPurchase = !isAgeRestricted || (Boolean(user) && isAgeVerified);

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

  const activeOriginalPrice =
    selectedVariant &&
    !selectedVariant.use_product_price &&
    selectedVariant.price
      ? Number(selectedVariant.price)
      : Number(originalPrice || 0);

  const activeOfferPrice =
    selectedVariant && !selectedVariant.use_product_price
      ? selectedVariant.offer_price
        ? Number(selectedVariant.offer_price)
        : null
      : offerPrice
        ? Number(offerPrice)
        : null;

  const activeFinalPrice = activeOfferPrice || activeOriginalPrice;

  const installmentsEnabled =
    selectedVariant && selectedVariant.installments_enabled !== undefined
      ? Boolean(selectedVariant.installments_enabled)
      : Boolean(
          professionalProduct?.installments_enabled ??
          item.installments_enabled,
        );

  const maxInstallments =
    selectedVariant && selectedVariant.max_installments
      ? Number(selectedVariant.max_installments)
      : Number(
          professionalProduct?.max_installments || item.max_installments || 12,
        );

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
  const hasDiscount = !!activeOfferPrice || percentDiscount > 0;
  const discountVal =
    percentDiscount > 0
      ? percentDiscount
      : activeOfferPrice && activeOriginalPrice
        ? Math.round((1 - activeOfferPrice / activeOriginalPrice) * 100)
        : 0;
  const currencySymbol = currencyCode === "USD" ? "USD $" : "$";

  const isWholesale =
    selectedVariant &&
    !selectedVariant.use_product_price &&
    selectedVariant.wholesale_price
      ? true
      : professionalProduct?.wholesale === true || item.wholesale === true;
  const wholesalePrice =
    selectedVariant &&
    !selectedVariant.use_product_price &&
    selectedVariant.wholesale_price
      ? selectedVariant.wholesale_price
      : professionalProduct?.wholesale_price || item.wholesale_price;
  const wholesaleUnit =
    selectedVariant &&
    !selectedVariant.use_product_price &&
    selectedVariant.wholesale_unit
      ? selectedVariant.wholesale_unit
      : professionalProduct?.wholesale_unit || item.wholesale_unit;

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

                  {/* Variants selector (if product has variants) */}
                  {variants.length > 0 && (
                    <div className="product-detail__variants-section">
                      <span className="product-detail__variants-label">
                        Elegí tu variante:
                      </span>
                      <div className="product-detail__variants-options">
                        {variants.map((v) => {
                          const isSelected = selectedVariant?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              className={`product-detail__variant-chip ${
                                isSelected
                                  ? "product-detail__variant-chip--active"
                                  : ""
                              }`}
                              onClick={() =>
                                setSelectedVariant(isSelected ? null : v)
                              }
                            >
                              <span>
                                {v.attribute_name}:{" "}
                                <strong>{v.attribute_value}</strong>
                              </span>
                              {v.price && !v.use_product_price && (
                                <span className="product-detail__variant-chip-price">
                                  $
                                  {Number(
                                    v.offer_price || v.price,
                                  ).toLocaleString("es-AR")}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="seller-card__price-row">
                    <div className="prices">
                      {(() => {
                        const finalPrice = activeFinalPrice;
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
                            {hasDiscount && activeOriginalPrice > 1 && (
                              <span className="seller-original-price">
                                {currencySymbol}
                                {formatPrice(activeOriginalPrice)}
                              </span>
                            )}
                            <div className="seller-current-price-row">
                              <span className="seller-price">
                                {currencySymbol}
                                {formatPrice(finalPrice)}
                              </span>
                              {discountVal > 0 && activeOriginalPrice > 1 && (
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
                  </div>

                  {/* Installments Information Box */}
                  {activeFinalPrice > 1 && (
                    <div className="seller-installments-box">
                      {installmentsEnabled ? (
                        <>
                          <div className="seller-installments-pill seller-installments-pill--free">
                            <CreditCard size={16} />
                            <span>
                              Hasta {maxInstallments} cuotas sin interés de $
                              {Math.round(
                                activeFinalPrice / maxInstallments,
                              ).toLocaleString("es-AR")}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="seller-installments-btn"
                            onClick={() => setIsInstallmentsModalOpen(true)}
                          >
                            Ver medios de pago y cuotas sin interés
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="seller-installments-pill">
                            <CreditCard size={16} />
                            <span>
                              1 pago de $
                              {activeFinalPrice.toLocaleString("es-AR")}{" "}
                              (débito/crédito)
                            </span>
                          </div>
                          <button
                            type="button"
                            className="seller-installments-btn"
                            onClick={() => setIsInstallmentsModalOpen(true)}
                          >
                            Ver opciones en cuotas fijas
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Age restriction alert */}
                  {isAgeRestricted && !canPurchase && (
                    <div className="product-detail__age-warning">
                      <ShieldAlert
                        size={20}
                        className="product-detail__age-warning-icon"
                      />
                      <div className="product-detail__age-warning-body">
                        <strong className="product-detail__age-warning-title">
                          Producto para mayores de 18 años
                        </strong>
                        <p className="product-detail__age-warning-text">
                          Para comprar este producto tenés que tener tu edad
                          verificada en tu cuenta.
                        </p>
                        {!user ? (
                          <button
                            type="button"
                            className="product-detail__age-warning-btn"
                            onClick={() =>
                              router.push(
                                `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
                              )
                            }
                          >
                            Iniciar sesión para verificar edad
                          </button>
                        ) : (
                          <span className="product-detail__age-warning-badge">
                            Edad no verificada · Actualizá tu cuenta para
                            habilitar la compra
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="seller-actions-group">
                    {activeFinalPrice > 1 && canPurchase && (
                      <>
                        <button
                          type="button"
                          className="seller-buy-btn"
                          onClick={() => setIsPaymentModalOpen(true)}
                        >
                          <CreditCard size={18} />
                          <span>Comprar ahora</span>
                        </button>

                        <div className="seller-protected-badge">
                          <ShieldCheck
                            size={18}
                            className="seller-protected-badge__icon"
                          />
                          <span className="seller-protected-badge__text">
                            Compra protegida o te devolvemos el dinero
                          </span>
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      className="seller-contact-btn"
                      onClick={handleContact}
                    >
                      <MessageCircle size={16} />
                      <span>Contactar al vendedor</span>
                    </button>

                    <FavoriteButton
                      type="product"
                      targetId={item?.id || id}
                      variant="banner"
                      showLabel
                      className="product-detail-favorite-btn"
                    />
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

        <CommentsCarousel
          type="product"
          targetId={String(item?.id || id || "")}
          title="Opiniones sobre el Producto"
        />
      </main>

      {/* Payment Checkout Modal (Getnet Cards + PayCloud QR) */}
      <ProductPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        product={item}
        professionalId={Number(professionalId || 0)}
        professionalProductId={professionalProductId}
        variants={variants}
        selectedVariant={selectedVariant}
        onSelectVariant={setSelectedVariant}
        sellerName={sellerName}
        sellerProvince={sellerProvince}
        isAgeRestricted={isAgeRestricted}
        canPurchase={canPurchase}
      />

      {/* Installments Breakdown Modal */}
      <ProductInstallmentsModal
        isOpen={isInstallmentsModalOpen}
        onClose={() => setIsInstallmentsModalOpen(false)}
        price={activeFinalPrice}
        installmentsEnabled={installmentsEnabled}
        maxInstallments={maxInstallments}
        productName={productName}
      />

      <Footer />
    </>
  );
}
