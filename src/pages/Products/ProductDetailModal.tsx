import {
  Star,
  Truck,
  ShieldCheck,
  ExternalLink,
  ShoppingCart,
  X,
  ChevronRight,
  Package,
} from "lucide-react";
import { useEffect } from "react";
import "./ProductDetailModal.css";

function formatPrice(n) {
  return n.toLocaleString("es-AR");
}

export default function ProductDetailModal({ product, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="product-modal__layout">
          {/* Image */}
          <div className="product-modal__image-section">
            <div className="product-modal__image-container">
              <img src={product.image} alt={product.title} />
              {product.discount > 0 && (
                <span className="product-modal__discount-badge">
                  -{product.discount}%
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="product-modal__info-section">
            <span className="product-modal__condition">
              {product.condition} | +{product.reviews} vendidos
            </span>
            <h2 className="product-modal__title">{product.title}</h2>

            <div className="product-modal__rating">
              <div className="product-modal__stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={
                      i < Math.round(product.rating) ? "currentColor" : "none"
                    }
                    className={
                      i < Math.round(product.rating)
                        ? "star-filled"
                        : "star-empty"
                    }
                  />
                ))}
              </div>
              <span className="product-modal__rating-text">
                {product.rating} ({product.reviews})
              </span>
            </div>

            <div className="product-modal__pricing">
              {product.originalPrice && (
                <span className="product-modal__original-price">
                  ${formatPrice(product.originalPrice)}
                </span>
              )}
              <div className="product-modal__price-row">
                <span className="product-modal__price">
                  ${formatPrice(product.price)}
                </span>
                {product.discount > 0 && (
                  <span className="product-modal__discount-text">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {product.freeShipping && (
              <div className="product-modal__shipping">
                <Truck size={16} />
                <span>Envío gratis</span>
              </div>
            )}

            <div className="product-modal__stock">
              <Package size={16} />
              <span>
                Stock disponible: <strong>{product.stock} unidades</strong>
              </span>
            </div>

            <div className="product-modal__seller">
              <ShieldCheck size={16} />
              <span>
                Vendido por <strong>{product.seller}</strong>
              </span>
            </div>

            <div className="product-modal__description">
              <h4>Descripción</h4>
              <p>{product.description}</p>
            </div>

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

            <div className="product-modal__actions">
              <a
                href={product.mercadoLibreUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="product-modal__btn product-modal__btn--primary"
              >
                <ShoppingCart size={18} />
                Comprar en Mercado Libre
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
