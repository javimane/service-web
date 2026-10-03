import React from "react";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import "./ProductCard.css";

interface ProductCardProps {
  product: any;
  onOpenDetail?: (product: any) => void;
  variant?: "default" | "small";
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  variant = "default",
}) => {
  // Support both nested product.Product and flat product objects
  const info = product?.Product || product || {};
  const images = info.Images || product?.Images || product?.images || [];
  const productId = product?.product_id || info.id || product?.id;

  const sortedImages = Array.isArray(images)
    ? [...images].sort((a: any, b: any) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
    : [];

  const primaryImage =
    sortedImages.find((img: any) => img.display_order === 0)?.image_url ||
    sortedImages[0]?.image_url ||
    (typeof sortedImages[0] === "string" ? sortedImages[0] : null) ||
    info.image_url ||
    product?.image_url ||
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";

  const regularPrice: number = Number(product?.price ?? info.price ?? 0);
  const offerPrice: number | null =
    (product?.offer_price ?? info.offer_price) != null
      ? Number(product?.offer_price ?? info.offer_price)
      : null;

  const rawDiscount = product?.percent_discount ?? info.percent_discount;
  const computedDiscount: number =
    rawDiscount != null && Number(rawDiscount) > 1
      ? Number(rawDiscount)
      : offerPrice !== null && offerPrice > 1 && regularPrice > 1
        ? Math.round((1 - offerPrice / regularPrice) * 100)
        : 0;

  const hasOffer = offerPrice !== null && offerPrice > 1;
  const displayPrice = hasOffer ? offerPrice! : regularPrice;

  const name = info.name || product?.name || "Producto";

  const isWholesale = Boolean(product?.wholesale ?? info.wholesale);
  const wholesalePrice = Number(product?.wholesale_price ?? info.wholesale_price ?? 0);
  const wholesaleUnit = product?.wholesale_unit ?? info.wholesale_unit ?? 1;

  const isConsultar = isWholesale
    ? wholesalePrice <= 1
    : displayPrice <= 1;

  const has2x1 = Boolean(product?.offer_2x1 ?? info.offer_2x1);
  const has3x2 = Boolean(product?.offer_3x2 ?? info.offer_3x2);

  return (
    <div
      className={`nearby-product-card ${variant === "small" ? "nearby-product-card--small" : ""}`}
      onClick={() => onOpenDetail && onOpenDetail(product)}
      role="button"
      tabIndex={0}
    >
      <div className="nearby-product-card__image">
        <img src={primaryImage} alt={name} loading="lazy" draggable="false" />
        <div className="nearby-product-card__favorite-wrap">
          <FavoriteButton type="product" targetId={productId} size={16} />
        </div>
        {hasOffer && !isWholesale && !isConsultar && (
          <span className="nearby-product-card__badge">OFERTA</span>
        )}
      </div>

      <div className="nearby-product-card__body">
        <h3 className="nearby-product-card__title">{name}</h3>
        {(has2x1 || has3x2) && (
          <span className="nearby-product-card__quantity-offer">
            {has2x1 ? "2x1" : "3x2"}
          </span>
        )}

        <div className="nearby-product-card__pricing">
          {isConsultar ? (
            <div className="nearby-product-card__price-row">
              <span className="nearby-product-card__price">
                Consultar
              </span>
            </div>
          ) : isWholesale ? (
            <>
              <span className="nearby-product-card__wholesale-tag">
                Por mayor
              </span>
              <div className="nearby-product-card__price-row">
                <span className="nearby-product-card__price">
                  ${wholesalePrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  <span className="nearby-product-card__wholesale-unit-label"> c/u</span>
                </span>
              </div>
              <span className="nearby-product-card__wholesale-min">
                Min. {wholesaleUnit} un.
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
