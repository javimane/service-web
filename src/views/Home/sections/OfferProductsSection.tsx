"use client";

import { useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Flame, Loader2, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProductsAction } from "@/app/actions/products";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import FavoriteButton from "../../../components/FavoriteButton/FavoriteButton";
import "./OfferProductsSection.css";

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("es-AR");
}

interface OfferProductsSectionProps {
  userProvince?: string;
  userProvinceId?: number;
}

export default function OfferProductsSection({
  userProvince = "Buenos Aires",
  userProvinceId,
}: OfferProductsSectionProps) {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".offer-product-card");

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["home-offer-products", userProvinceId],
    queryFn: async () => {
      // First try fetching offers filtered by province if provided
      let result = await getProductsAction({
        provinceId: userProvinceId,
        has_offer: true,
        limit: 20,
      });

      const items = Array.isArray(result?.data)
        ? result.data
        : Array.isArray((result?.data as any)?.data)
          ? (result?.data as any).data
          : [];

      // If no offers exist in the selected province, fetch general offers
      if (items.length === 0 && userProvinceId) {
        result = await getProductsAction({
          has_offer: true,
          limit: 20,
        });
      }

      if (result?.data) {
        return result.data;
      }

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return null;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  const productsList = useMemo(() => {
    if (!productsData) return [];
    const rawList = Array.isArray(productsData)
      ? productsData
      : Array.isArray((productsData as any).data)
        ? (productsData as any).data
        : Array.isArray((productsData as any).products)
          ? (productsData as any).products
          : [];

    return rawList.map((item: any) => {
      const product = item.Product || item;
      const images = product?.Images || [];
      const sortedImages = [...images].sort(
        (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0),
      );
      const primaryImage =
        sortedImages[0]?.image_url ||
        product?.image_url ||
        "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";

      const sellers = product.ProfessionalProducts || [];
      const firstSeller = sellers[0] || {};

      const price = Number(firstSeller.price || product.price || 0);
      const offerPrice = Number(firstSeller.offer_price || product.offer_price || 0);
      const percentDiscount = Number(
        product.percent_discount ||
          firstSeller.percent_discount ||
          firstSeller.discount_percentage ||
          0,
      );

      const discountVal =
        percentDiscount > 0
          ? percentDiscount
          : price > 0 && offerPrice > 0 && offerPrice < price
            ? Math.round((1 - offerPrice / price) * 100)
            : 0;

      const currencyCode =
        product.currency_code || firstSeller.currency_code || "ARG";

      const companyData = firstSeller.Professional?.Company;
      const sellerName = Array.isArray(companyData)
        ? companyData[0]?.name
        : companyData?.name || "Vendedor";

      return {
        id: product.id,
        productId: product.id,
        title: product.name || "Producto en oferta",
        price,
        offerPrice,
        discountVal,
        currencyCode,
        seller: sellerName,
        image: primaryImage,
        seo_path: product.seo_path,
        _original: item,
      };
    });
  }, [productsData]);

  if (!isLoading && productsList.length === 0) {
    return null;
  }

  const handleCardClick = (product: any) => {
    if (product.seo_path) {
      router.push(`/productos${product.seo_path}`);
    } else {
      const slug = product.title.trim().toLowerCase().replace(/\s+/g, "-");
      router.push(`/productos/${slug}?id=${product.id}`);
    }
  };

  return (
    <section className="offer-products-section">
      <div className="home-section-container">
        <div className="offer-products-section__header">
          <div className="offer-products-section__title-group">
            <span className="offer-products-section__badge">
              <Flame size={13} /> Descuentos del día
            </span>
            <h2 className="offer-products-section__title">
              Ofertas Imperdibles
            </h2>
            <p className="section-subtitle">
              Precios rebajados y promociones exclusivas en productos
            </p>
          </div>
          <button
            className="section-link"
            onClick={() => router.push("/productos?is_offer=true")}
          >
            Ver todas las ofertas <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
        <div className="offer-products-section__carousel">
          {isLoading ? (
            <div className="offer-products-section__loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Buscando ofertas activas...</p>
            </div>
          ) : (
            <>
              <button
                className={`carousel-control carousel-control--left ${
                  showLeftArrow ? "" : "carousel-control--hidden"
                }`}
                type="button"
                onClick={() => scrollCarousel(-1)}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                ref={sliderRef}
                className="offer-products-section__scroll"
                onScroll={updateArrowVisibility}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {productsList.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="offer-product-card"
                    onClick={() => handleCardClick(product)}
                  >
                    <div className="offer-product-card__image">
                      <img
                        src={product.image}
                        alt={product.title}
                        draggable="false"
                      />
                      <div className="offer-product-card__favorite-wrap">
                        <FavoriteButton
                          type="product"
                          targetId={product.id}
                          size={16}
                        />
                      </div>
                      <div className="offer-product-card__badges">
                        <span className="offer-product-card__badge-offer">
                          <Flame size={10} /> OFERTA
                        </span>
                        {product.discountVal > 0 && (
                          <span className="offer-product-card__badge-discount">
                            -{product.discountVal}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="offer-product-card__body">
                      <span className="offer-product-card__seller">
                        {product.seller}
                      </span>
                      <h3 className="offer-product-card__title">
                        {product.title}
                      </h3>

                      <div className="offer-product-card__pricing">
                        {product.price > 1 && product.offerPrice > 0 && (
                          <span className="offer-product-card__original">
                            {product.currencyCode === "USD" ? "USD $" : "$"}
                            {formatPrice(product.price)}
                          </span>
                        )}
                        <div className="offer-product-card__price-row">
                          <span className="offer-product-card__price">
                            {(() => {
                              const finalPrice =
                                product.offerPrice > 0
                                  ? product.offerPrice
                                  : product.price;
                              if (!finalPrice || finalPrice <= 1) {
                                return "Consultar";
                              }
                              return `${
                                product.currencyCode === "USD" ? "USD $" : "$"
                              }${formatPrice(finalPrice)}`;
                            })()}
                          </span>
                          {product.discountVal > 0 && product.price > 1 && (
                            <span className="offer-product-card__discount-tag">
                              {product.discountVal}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                className={`carousel-control carousel-control--right ${
                  showRightArrow ? "" : "carousel-control--hidden"
                }`}
                type="button"
                onClick={() => scrollCarousel(1)}
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
