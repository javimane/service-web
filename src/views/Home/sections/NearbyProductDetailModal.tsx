"use client";
import {
  X,
  MapPin,
  Truck,
  ShieldCheck,
  Package,
  ChevronRight,
  MessageCircle,
  User,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productService } from "../../../services/productService";
import { getProfilePath } from "../../../utils/utils";
import "./NearbyProductDetailModal.css";

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

export default function NearbyProductDetailModal({ product, isOpen, onClose }) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: sellersData, isLoading: isLoadingSellers } = useQuery({
    queryKey: ["product-sellers", product?.Product?.id],
    queryFn: () => productService.list({ product_id: product?.Product?.id }),
    enabled: !!product?.Product?.id && isOpen,
  });

  const allSellers = sellersData?.data || [];
  const images = product?.Product?.image_url || [
    "https://via.placeholder.com/600",
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentImageIndex(0);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleDirectMessage = (professionalId) => {
    router.push(
      `/messages?to=${professionalId}&product=${product.Product?.id}`,
    );
    onClose();
  };

  const handleViewProfile = (professional: any) => {
    router.push(getProfilePath(professional?.id, professional?.seo_path));
    onClose();
  };

  return (
    <div className="np-modal-overlay" onClick={onClose}>
      <div className="np-modal" onClick={(e) => e.stopPropagation()}>
        <button className="np-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="np-modal__layout">
          {/* Image section */}
          <div className="np-modal__image-section">
            <div className="np-modal__image-container">
              <img
                src={images[currentImageIndex]}
                alt={product.Product?.name}
              />

              {images.length > 1 && (
                <div className="np-modal__image-nav">
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        (prev) => (prev - 1 + images.length) % images.length,
                      )
                    }
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev + 1) % images.length)
                    }
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

              <div className="np-modal__image-dots">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`dot ${i === currentImageIndex ? "active" : ""}`}
                    onClick={() => setCurrentImageIndex(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Info section */}
          <div className="np-modal__info-section">
            <span className="np-modal__condition">
              Producto | {product.Product?.brand || "Genérico"}
            </span>

            <h2 className="np-modal__title">{product.Product?.name}</h2>

            <div className="np-modal__description">
              <p>{product.Product?.description}</p>
            </div>

            <div className="np-modal__sellers-section">
              <h4>Vendedores Cercanos</h4>
              {isLoadingSellers ? (
                <div className="sellers-loading">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Buscando mejores precios...</span>
                </div>
              ) : (
                <div className="sellers-list">
                  {allSellers.map((sellerRel) => (
                    <div key={sellerRel.id} className="seller-item">
                      <div
                        className="seller-item__main"
                        onClick={() =>
                          handleViewProfile(sellerRel.Professional)
                        }
                      >
                        <img
                          src={
                            sellerRel.Professional?.Profile?.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerRel.Professional?.Profile?.display_name || "P")}`
                          }
                          alt="Seller"
                        />
                        <div className="seller-item__info">
                          <span className="seller-item__name">
                            {sellerRel.Professional?.Profile?.display_name ||
                              sellerRel.Professional?.Company?.name}
                          </span>
                        </div>
                      </div>

                      <div className="seller-item__price-block">
                        {sellerRel.offer_price && (
                          <span className="seller-item__original">
                            ${formatPrice(sellerRel.price)}
                          </span>
                        )}
                        <span className="seller-item__current">
                          $
                          {formatPrice(
                            sellerRel.offer_price || sellerRel.price,
                          )}
                        </span>
                      </div>

                      <div className="seller-item__actions">
                        <button
                          className="btn-msg"
                          onClick={() =>
                            handleDirectMessage(sellerRel.Professional?.id)
                          }
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          className="btn-prof"
                          onClick={() =>
                            handleViewProfile(sellerRel.Professional)
                          }
                        >
                          <User size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {product.Product?.features && (
              <div className="np-modal__features">
                <h4>Características</h4>
                <ul>
                  {product.Product.features.map((feat, i) => (
                    <li key={i}>
                      <ChevronRight size={14} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
