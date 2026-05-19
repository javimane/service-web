"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Truck,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProductsAction } from "../../../app/actions/products";
import { getProvincesAction } from "@/app/actions/provinces";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import NearbyProductDetailModal from "./NearbyProductDetailModal";
import "./NearbyProductsSection.css";

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

type UserLocation = {
  lat: number;
  lng: number;
};

export default function NearbyProductsSection({ userProvince = "Buenos Aires" }: { userProvince?: string }) {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".nearby-product-card");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setUserLocation({ lat: -34.6037, lng: -58.3816 }); // Default
      },
    );
  }, []);

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  const provinceId = useMemo(() => {
    return provinces.find((p: any) => p.name === userProvince)?.id;
  }, [provinces, userProvince]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["nearby-products", userLocation, provinceId],
    queryFn: async () => {
      const result = await getProductsAction({
        provinceId: provinceId,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: 30,
        limit: 20,
      });

      if (result?.data) {
        return result.data;
      }

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const productsList = useMemo(() => {
    if (!productsData) return [];
    if (Array.isArray(productsData)) return productsData;

    const payload = productsData as any;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.products)) return payload.products;

    return [];
  }, [productsData]);

  return (
    <section className="nearby-products">
      <div className="home-section-container">
        <div className="nearby-products__header">
          <div className="nearby-products__title-group">
            <h2 className="nearby-products__title">Productos en {userProvince}</h2>
          </div>
          <button
            className="section-link"
            onClick={() => router.push("/productos")}
          >
            Ver todo <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
        <div className="nearby-products__carousel">
          <button
            className={`carousel-control carousel-control--left ${showLeftArrow ? "" : "carousel-control--hidden"}`}
            type="button"
            onClick={() => scrollCarousel(-1)}
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={sliderRef}
            className="nearby-products__scroll"
            onScroll={updateArrowVisibility}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {isLoading ? (
              <div className="products-loading">
                <Loader2 className="animate-spin" size={32} />
                <p>Buscando productos cercanos...</p>
              </div>
            ) : productsList.length === 0 ? (
              <div className="products-empty">
                <Sparkles size={40} />
                <p>No se encontraron productos premium cerca.</p>
              </div>
            ) : (
              productsList.map((item: any) => {
                const mainImage =
                  item.Images?.[0]?.image_url ||
                  "https://via.placeholder.com/300";
                const profProduct = item.ProfessionalProducts?.[0];
                const professional = profProduct?.Professional;
                const companyName =
                  professional?.Company?.[0]?.name || "Vendedor";
                const avatarUrl =
                  professional?.Profile?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}`;
                const price = item.price || profProduct?.price || 0;
                const offerPrice = profProduct?.offer_price || 0;
                const hasOffer = offerPrice > 0 && offerPrice < price;

                return (
                  <article
                    key={item.id}
                    className="nearby-product-card"
                    onClick={() => {
                      if (item.seo_path) {
                        router.push(`/productos${item.seo_path}`);
                      } else {
                        const slug = item.name
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-");
                        router.push(`/productos/${slug}?id=${item.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="nearby-product-card__image">
                      <img src={mainImage} alt={item.name} draggable="false" />
                      {hasOffer && (
                        <span className="nearby-product-card__badge">
                          OFERTA
                        </span>
                      )}
                    </div>

                    <div className="nearby-product-card__body">
                      <div className="nearby-product-card__seller-row">
                        <img
                          src={avatarUrl}
                          alt={companyName}
                          className="nearby-product-card__seller-avatar"
                          draggable="false"
                        />
                        <span className="nearby-product-card__seller-name">
                          {companyName}
                        </span>
                      </div>

                      <h3 className="nearby-product-card__title">
                        {item.name}
                      </h3>

                      <div className="nearby-product-card__pricing">
                        {hasOffer && (
                          <span className="nearby-product-card__original">
                            ${formatPrice(price)}
                          </span>
                        )}
                        <div className="nearby-product-card__price-row">
                          <span className="nearby-product-card__price">
                            ${formatPrice(hasOffer ? offerPrice : price)}
                          </span>
                        </div>
                      </div>

                      <div className="nearby-product-card__meta">
                        <span className="nearby-product-card__distance">
                          <MapPin size={12} />{" "}
                          {item.distance
                            ? `${item.distance.toFixed(1)} km`
                            : "Mendoza"}{" "}
                          {/* Fallback to Mendoza as per snippet */}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <button
            className={`carousel-control carousel-control--right ${showRightArrow ? "" : "carousel-control--hidden"}`}
            type="button"
            onClick={() => scrollCarousel(1)}
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <NearbyProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
