import React from "react";
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
    product.percent_discount != null && product.percent_discount > 1
      ? product.percent_discount
      : offerPrice !== null && offerPrice > 1 && regularPrice > 1
        ? Math.round((1 - offerPrice / regularPrice) * 100)
        : 0;

  const hasOffer = offerPrice !== null && offerPrice > 1;
  const displayPrice = hasOffer ? offerPrice! : regularPrice;

  const name = info.name || "Producto";

  const isConsultar = product.wholesale
    ? Number(product.wholesale_price || 0) <= 1
    : displayPrice <= 1;

  return (
    <div
      className={`nearby-product-card ${variant === "small" ? "nearby-product-card--small" : ""}`}
      onClick={() => onOpenDetail && onOpenDetail(product)}
      role="button"
      tabIndex={0}
    >
      <div className="nearby-product-card__image">
        <img src={primaryImage} alt={name} loading="lazy" draggable="false" />
        {hasOffer && !product.wholesale && !isConsultar && (
          <span className="nearby-product-card__badge">OFERTA</span>
        )}
      </div>

      <div className="nearby-product-card__body">
        <h3 className="nearby-product-card__title">{name}</h3>

        <div className="nearby-product-card__pricing" style={{ marginTop: 'auto' }}>
          {isConsultar ? (
            <div className="nearby-product-card__price-row">
              <span className="nearby-product-card__price" style={{ fontSize: "1.1rem" }}>
                Consultar
              </span>
            </div>
          ) : product.wholesale ? (
            <>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: 'var(--brand-blue)',
                  textTransform: 'uppercase',
                  marginBottom: '2px',
                }}
              >
                Por mayor
              </span>
              <div className="nearby-product-card__price-row">
                <span className="nearby-product-card__price">
                  ${Number(product.wholesale_price || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "var(--text-secondary)" }}> c/u</span>
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
                Min. {product.wholesale_unit} un.
              </span>
            </>
          ) : hasOffer ? (
            <>
              <span className="nearby-product-card__original">
                ${regularPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </span>
              <div className="nearby-product-card__price-row">
                <span className="nearby-product-card__price">
                  ${offerPrice!.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
                <span className="nearby-product-card__discount">
                  {computedDiscount}% OFF
                </span>
              </div>
            </>
          ) : (
            <div className="nearby-product-card__price-row">
              <span className="nearby-product-card__price">
                ${displayPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
