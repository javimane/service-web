import React from "react";
import { Tag } from "lucide-react";
import "./ProductCard.css";

const ProductCard = ({ product, onOpenDetail, variant = "default" }) => {
  // Data is nested inside product.Product
  const info = product.Product || {};
  const images = info.Images || [];

  const primaryImage =
    images.find((img) => img.display_order === 0)?.image_url ||
    images[0]?.image_url ||
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";

  const regularPrice: number = product.price || 0;
  const offerPrice: number | null = product.offer_price ?? null;

  // Compute discount % from offer_price if percent_discount is null
  const computedDiscount: number =
    product.percent_discount != null
      ? product.percent_discount
      : offerPrice && regularPrice > 0
        ? Math.round((1 - offerPrice / regularPrice) * 100)
        : 0;

  const hasOffer = offerPrice !== null && offerPrice < regularPrice;
  const displayPrice = hasOffer ? offerPrice! : regularPrice;

  const name = info.name || "Producto";
  const brand = info.brand;
  const category = info.category?.name;

  return (
    <div
      className={`product-card-premium ${variant === "small" ? "product-card-premium--small" : ""}`}
      onClick={() => onOpenDetail && onOpenDetail(product)}
    >
      <div className="product-card-premium__image">
        <img src={primaryImage} alt={name} loading="lazy" />

        {/* OFERTA badge – top left */}
        {hasOffer && (
          <span className="product-badge-oferta">OFERTA</span>
        )}
      </div>

      <div className="product-card-premium__content">
        {brand && <span className="product-brand">{brand}</span>}
        <h3 className="product-title">{name}</h3>

        <div className="product-pricing">
          {hasOffer ? (
            <>
              {/* Original price – crossed out */}
              <span className="original-price">
                ${regularPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </span>
              {/* Offer price + discount % inline */}
              <div className="offer-row">
                <span className="current-price current-price--offer">
                  ${offerPrice!.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
                <span className="discount-pill">-{computedDiscount}% OFF</span>
              </div>
            </>
          ) : (
            <span className="current-price">
              ${displayPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

