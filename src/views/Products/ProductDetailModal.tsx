"use client";
import {
  Star,
  Truck,
  ShieldCheck,
  ExternalLink,
  ShoppingCart,
  X,
  ChevronRight,
  ChevronLeft,
  Package,
  MapPin,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { productService } from "../../services/productService";
import { getProfilePath } from "../../utils/utils";
import "./ProductDetailModal.css";

function formatPrice(n) {
  if (!n) return "0";
  return Number(n).toLocaleString("es-AR");
}

export default function ProductDetailModal({ product, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
  }, [isOpen, product]);

  const images = product?.images?.length ? product.images : [product?.image];

  const sellers = product?.sellers || [];

  if (!isOpen || !product) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleContact = (professionalId) => {
    onClose();
    window.location.assign(`/messages?professionalId=${professionalId}`);
  };

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="product-modal__layout">
          {/* Left Column: Image Carousel + Product Details */}
          <div className="product-modal__left-column">
            <div className="product-modal__image-container">
              <img src={images[currentImageIndex]} alt={product.title} />

              {images.length > 1 && (
                <>
                  <button className="carousel-btn prev" onClick={prevImage}>
                    <ChevronLeft size={20} />
                  </button>
                  <button className="carousel-btn next" onClick={nextImage}>
                    <ChevronRight size={20} />
                  </button>
                  <div className="carousel-indicators">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`indicator ${i === currentImageIndex ? "active" : ""}`}
                        onClick={() => setCurrentImageIndex(i)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <h2 className="product-modal__title">{product.title}</h2>

            {product.description && (
              <div className="product-modal__description-container">
                <h4>Descripción</h4>
                <p className="product-modal__description">
                  {product.description}
                </p>
              </div>
            )}

            {product.features && (
              <div className="product-modal__features">
                <h4>Características</h4>
                <ul>
                  {product.features.map((feat, i) => (
                    <li key={i}>
                      <ChevronRight size={14} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Info & Sellers */}
          <div className="product-modal__right-column">
            <div className="product-modal__sellers-container">
              <h3 className="sellers-title">
                Disponible en {sellers.length} tiendas
              </h3>

              <div className="sellers-list">
                {sellers.map((item: any, idx: number) => {
                  const professionalAny = item?.Professional as any;
                  const companyData =
                    professionalAny?.Company ||
                    professionalAny?.Companies ||
                    professionalAny?.company ||
                    professionalAny?.companies;
                  const sellerName = Array.isArray(companyData)
                    ? companyData[0]?.name
                    : companyData?.name || "Profesional independiente";

                  const addressData =
                    professionalAny?.address || professionalAny?.Address;
                  const sellerProvince = Array.isArray(addressData)
                    ? addressData[0]?.Province?.name ||
                      addressData[0]?.province?.name
                    : addressData?.Province?.name ||
                      addressData?.province?.name ||
                      "Ubicación no especificada";

                  const professionalId =
                    professionalAny?.id || item.professional_id;
                  const userId = professionalAny?.user_id || professionalId;

                  // Determine Prices
                  const hasDiscount =
                    item.offer_price || item.discount_percentage > 0;
                  const originalPrice = item.price;
                  const offerPrice = item.offer_price;
                  const discountPerc = item.discount_percentage;

                  return (
                    <div key={item.id || idx} className="seller-card">
                      <div className="seller-card__header">
                        <ShieldCheck size={18} className="seller-icon" />
                        <div className="seller-card__info">
                          <span className="seller-label">Vendido por</span>
                          <Link
                            href={getProfilePath(
                              userId,
                              professionalAny?.seo_path,
                            )}
                            onClick={onClose}
                            className="seller-name"
                          >
                            {sellerName}
                          </Link>
                        </div>
                      </div>

                      <div className="seller-card__location">
                        <MapPin size={14} />
                        <span>{sellerProvince}</span>
                      </div>

                      <div className="seller-card__price-row">
                        <div className="prices">
                          {hasDiscount && (
                            <span className="seller-original-price">
                              ${formatPrice(originalPrice)}
                            </span>
                          )}
                          <div className="seller-current-price-row">
                            <span className="seller-price">
                              $
                              {formatPrice(
                                hasDiscount && offerPrice
                                  ? offerPrice
                                  : originalPrice,
                              )}
                            </span>
                            {hasDiscount && discountPerc > 0 && (
                              <span className="seller-discount">
                                {discountPerc}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          className="seller-contact-btn"
                          onClick={() => handleContact(professionalId)}
                        >
                          <MessageCircle size={16} />
                          Contactar
                        </button>
                      </div>
                    </div>
                  );
                })}

                {sellers.length === 0 && (
                  <div className="sellers-empty">
                    No hay vendedores disponibles para este producto.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
