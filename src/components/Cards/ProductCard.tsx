import React from "react";
import { Flame } from "lucide-react";
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
  const sellers =
    product?.sellers || product?.ProfessionalProducts ||
    product?.professional_products || info?.ProfessionalProducts ||
    info?.professional_products || product?._original?.ProfessionalProducts || [];
  const seller = Array.isArray(sellers)
    ? sellers.find((entry: any) => entry?.is_active !== false) || sellers[0]
    : null;

  const sortedImages = Array.isArray(images)
    ? [...images].sort(
        (a: any, b: any) =>
          (Number(a.display_order) || 0) - (Number(b.display_order) || 0),
      )
    : [];

  const primaryImage =
    sortedImages.find((img: any) => img?.display_order === 0)?.image_url ||
    (typeof sortedImages[0] === "string"
      ? sortedImages[0]
      : sortedImages[0]?.image_url) ||
    product?.image ||
    info.image_url ||
    product?.image_url ||
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";

  // Raw API products keep prices in ProfessionalProducts; catalog cards already
  // flatten them to price/originalPrice/offerPrice.
  const listedPrice = Number(product?.price ?? seller?.price ?? info.price ?? 0);
  const originalPrice = Number(product?.originalPrice ?? product?.original_price ?? 0);
  const regularPrice = originalPrice > listedPrice
    ? originalPrice
    : Number(seller?.price ?? product?.price ?? info.price ?? 0);
  const explicitOffer = Number(
    product?.offerPrice ?? product?.offer_price ?? seller?.offer_price ?? info.offer_price ?? 0,
  );
  const offerPrice = explicitOffer > 0 && explicitOffer < regularPrice
    ? explicitOffer
    : originalPrice > listedPrice && listedPrice > 0
      ? listedPrice
      : null;
  const hasOffer = offerPrice !== null;
  const displayPrice = offerPrice ?? regularPrice;
  const computedDiscount = hasOffer && regularPrice > 0
    ? Math.round((1 - offerPrice / regularPrice) * 100)
    : 0;
  const formatPrice = (value: number) => value.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  });

  const name = info.name || product?.name || product?.title || "Producto";
  const wholesalePrice = Number(
    product?.wholesale_price ?? seller?.wholesale_price ?? info.wholesale_price ?? 0,
  );
  const wholesaleUnit = Number(
    product?.wholesale_unit ?? seller?.wholesale_unit ?? info.wholesale_unit ?? 1,
  );
  const isWholesale = Boolean(product?.wholesale ?? seller?.wholesale ?? info.wholesale)
    && wholesalePrice > 0 && wholesaleUnit > 1;
  const visiblePrice = displayPrice > 0 ? displayPrice : isWholesale ? wholesalePrice : 0;
  const isConsultar = visiblePrice <= 0;
  const has2x1 = Boolean(product?.offer_2x1 ?? seller?.offer_2x1 ?? info.offer_2x1);
  const has3x2 = Boolean(product?.offer_3x2 ?? seller?.offer_3x2 ?? info.offer_3x2);
  const hasFreeShipping = Boolean(product?.freeShipping ?? product?.free_shipping ?? seller?.free_shipping);
  const hasLastUnit = (() => {
    if (product?.hasLastUnit != null) return Boolean(product.hasLastUnit);
    const list = Array.isArray(sellers) ? sellers : null;
    if (list && list.length > 0) {
      return list.some(
        (pp: any) =>
          pp &&
          pp.is_active !== false &&
          pp.stock !== null &&
          pp.stock !== undefined &&
          Number(pp.stock) === 1,
      );
    }
    const directStock = product?.stock ?? info?.stock;
    return (
      directStock !== null &&
      directStock !== undefined &&
      Number(directStock) === 1
    );
  })();

  return (
    <div
      className={`nearby-product-card ${variant === "small" ? "nearby-product-card--small" : ""}`}
      onClick={() => onOpenDetail && onOpenDetail(product)}
      onKeyDown={(event) => {
        if (onOpenDetail && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpenDetail(product);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="nearby-product-card__image">
        <img src={primaryImage} alt={name} loading="lazy" draggable="false" />
        {hasLastUnit && (
          <span className="nearby-product-card__last-unit">
            <Flame size={13} />
            Última unidad
          </span>
        )}
        {hasOffer && !isConsultar && (
          <span className="nearby-product-card__badge">OFERTA</span>
        )}
      </div>

      <div className="nearby-product-card__body">
        <h3 className="nearby-product-card__title">{name}</h3>
        {(has2x1 || has3x2) && (
          <span className="nearby-product-card__quantity-offer">
            {has2x1 ? "OFERTA 2x1" : "OFERTA 3x2"}
          </span>
        )}

        <div className="nearby-product-card__pricing">
          {isConsultar ? (
            <div className="nearby-product-card__price-row">
              <span className="nearby-product-card__price">Consultar</span>
            </div>
          ) : hasOffer ? (
            <>
              <span className="nearby-product-card__original">
                $
                {formatPrice(regularPrice)}
              </span>
              <div className="nearby-product-card__price-row">
                <span className="nearby-product-card__price">
                  $
                  {formatPrice(offerPrice)}
                </span>
                {computedDiscount > 0 && (
                  <span className="nearby-product-card__discount">
                    {computedDiscount}% OFF
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="nearby-product-card__price-row">
              <span className="nearby-product-card__price">
                $
                {formatPrice(visiblePrice)}
              </span>
            </div>
          )}
          {isWholesale && (
            <span className="nearby-product-card__wholesale-min">
              Por mayor: ${formatPrice(wholesalePrice)} c/u desde {wholesaleUnit} un.
            </span>
          )}
          {hasFreeShipping && (
            <span className="nearby-product-card__free-shipping">Envío gratis</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
