import { MapPin, Star, ArrowRight } from "lucide-react";
import "./ServiceCard.css";

export default function ServiceCard({ service, viewMode = "grid", onClick }) {
  // Map some categories to badges to match the reference image's variety
  const getBadgeType = (category) => {
    const badges = {
      'Arquitectura': 'PREMIUM',
      'Diseño': 'FEATURED',
      'Sustentabilidad': 'ECO',
      'Ingeniería': 'TECHNICAL'
    };
    return badges[category] || 'SPECIAL';
  };

  const badgeType = getBadgeType(service.category);

  return (
    <article 
      className={`service-card-modern view-${viewMode}`} 
      onClick={() => onClick(service)}
    >
      {/* Location and Badge */}
      <div className="card-top">
        <div className="card-location">
          <MapPin size={12} className="loc-icon" />
          <span>{service.city.toUpperCase()}, ESPAÑA</span>
        </div>
        <div className={`card-badge badge-${badgeType.toLowerCase()}`}>
          {badgeType}
        </div>
      </div>

      {/* Title */}
      <div className="card-main">
        <h3 className="card-title">{service.specialty}</h3>
        
        {/* Author & Rating */}
        <div className="card-author">
          <img src={service.avatar} alt={service.name} className="author-avatar" />
          <div className="author-meta">
            <span className="author-name">{service.name}</span>
            <div className="author-rating">
              <Star size={12} fill="#B5FF24" color="#B5FF24" />
              <span>{service.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description (Mainly for List View) */}
      {viewMode === 'list' && (
        <p className="card-description">{service.description}</p>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div className="card-price">
          <span className="price-currency">€</span>
          <span className="price-value">{parseInt(service.price.replace(/\D/g, '')) || service.price}</span>
          <span className="price-plus">+</span>
        </div>
        
        <button className="card-cta">
          VER DETALLES <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
