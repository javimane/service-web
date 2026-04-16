import {
  X,
  Star,
  MapPin,
  Truck,
  ShieldCheck,
  Package,
  ChevronRight,
  MessageCircle,
  User,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NearbyProductDetailModal.css";

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

export default function NearbyProductDetailModal({ product, isOpen, onClose }) {
  const navigate = useNavigate();

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

  const whatsappMessage = encodeURIComponent(
    `Hola ${product.seller}, estoy interesado en: ${product.title} ($${formatPrice(product.price)}). ¿Está disponible?`,
  );
  const whatsappUrl = `https://wa.me/${product.sellerPhone}?text=${whatsappMessage}`;

  const handleDirectMessage = () => {
    navigate(`/messages?to=${product.sellerId}&product=${product.id}`);
    onClose();
  };

  const handleViewProfile = () => {
    navigate(`/profile/${product.sellerId}`);
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
              <img src={product.image} alt={product.title} />
              {product.discount > 0 && (
                <span className="np-modal__discount-badge">
                  -{product.discount}%
                </span>
              )}
            </div>
          </div>

          {/* Info section */}
          <div className="np-modal__info-section">
            {/* Seller header */}
            <div className="np-modal__seller-header">
              <img
                src={product.sellerAvatar}
                alt={product.seller}
                className="np-modal__seller-avatar"
              />
              <div className="np-modal__seller-info">
                <span className="np-modal__seller-name">{product.seller}</span>
                <span className="np-modal__seller-distance">
                  <MapPin size={12} /> {product.distance}
                </span>
              </div>
            </div>

            <span className="np-modal__condition">
              {product.condition} | {product.category}
            </span>

            <h2 className="np-modal__title">{product.title}</h2>

            <div className="np-modal__rating">
              <div className="np-modal__stars">
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
              <span className="np-modal__rating-text">
                {product.rating} ({product.reviews} opiniones)
              </span>
            </div>

            <div className="np-modal__pricing">
              {product.originalPrice && (
                <span className="np-modal__original-price">
                  ${formatPrice(product.originalPrice)}
                </span>
              )}
              <div className="np-modal__price-row">
                <span className="np-modal__price">
                  ${formatPrice(product.price)}
                </span>
                {product.discount > 0 && (
                  <span className="np-modal__discount-text">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {product.freeShipping && (
              <div className="np-modal__shipping">
                <Truck size={16} />
                <span>Envío gratis</span>
              </div>
            )}

            <div className="np-modal__stock">
              <Package size={16} />
              <span>
                Stock disponible: <strong>{product.stock} unidades</strong>
              </span>
            </div>

            <div className="np-modal__seller-badge">
              <ShieldCheck size={16} />
              <span>
                Vendido por <strong>{product.seller}</strong>
              </span>
            </div>

            <div className="np-modal__description">
              <h4>Descripción</h4>
              <p>{product.description}</p>
            </div>

            {product.features && (
              <div className="np-modal__features">
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

            {/* Action buttons */}
            <div className="np-modal__actions">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="np-modal__btn np-modal__btn--whatsapp"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Consultar por WhatsApp
              </a>

              <button
                type="button"
                className="np-modal__btn np-modal__btn--message"
                onClick={handleDirectMessage}
              >
                <MessageCircle size={18} />
                Mensaje directo
              </button>

              <button
                type="button"
                className="np-modal__btn np-modal__btn--profile"
                onClick={handleViewProfile}
              >
                <User size={18} />
                Ver perfil del profesional
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
