import { MapPin, Star, ArrowRight, CheckCircle, Share2 } from "lucide-react";
import "./ServiceCard.css";

export default function ServiceCard({ service, viewMode = "grid", onClick }) {
  // Safe extraction of data from ServiceRow structure
  const serviceName = service.name || "Servicio sin nombre";
  const professional = service.Professional || service.professional;
  const profile = professional?.Profile || professional?.profile;
  const company = professional?.companies?.[0] || professional?.Companies?.[0];

  const professionalName =
    company?.name || profile?.display_name || "Profesional";
  const avatar =
    profile?.avatar_url ||
    profile?.portfolio_image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(professionalName)}&background=random`;
  const price = service.base_price || 0;
  const categoryName =
    service.CategoryService?.name || service.category?.name || "General";
  const rating = professional?.rating_avg || 0;
  const isVerified = company?.companies_arca?.[0]?.is_verified || false;

  // Location extraction
  const address = professional?.address?.[0] || professional?.Address?.[0];
  const locationName = address?.province?.name || address?.city || "Mendoza";

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug =
      service.seo_path ||
      service.seoPath ||
      (service.name
        ? service.name.trim().toLowerCase().replace(/\s+/g, "-")
        : `service-${service.id}`);
    const url = `${window.location.origin}/servicios/${slug}?id=${service.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: serviceName,
          text: `Mirá este servicio en Sercio: ${serviceName}`,
          url: url,
        });
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {}
    }
  };

  return (
    <article
      className={`service-card-modern view-${viewMode}`}
      onClick={() => onClick(service)}
    >
      {/* Location & Share */}
      <div className="card-top">
        <div className="card-location">
          <MapPin size={12} className="loc-icon" />
          <span>{locationName.toUpperCase()}</span>
        </div>
        <button
          className="card-share-btn"
          title="Compartir servicio"
          type="button"
          onClick={handleShare}
        >
          <Share2 size={14} />
        </button>
      </div>

      {/* Title */}
      <div className="card-main">
        <h3 className="card-title">{serviceName}</h3>

        {/* Author & Rating */}
        <div className="card-author">
          <img src={avatar} alt={professionalName} className="author-avatar" />
          <div className="author-meta">
            {isVerified && (
              <div className="verified-badge-inline">
                <CheckCircle size={10} fill="#00e676" color="#ffffff" />
                <span>Verificado</span>
              </div>
            )}
            <span className="author-name">{professionalName}</span>
            <div className="author-rating">
              <Star size={12} fill="#e94823" color="#e94823" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description (Mainly for List View) */}
      {viewMode === "list" && (
        <p className="card-description">{service.description}</p>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div className="card-price">
          <span className="price-currency">$</span>
          <span className="price-value">{price.toLocaleString("es-AR")}</span>
        </div>

        <button
          className="card-cta"
          onClick={(e) => {
            e.stopPropagation();
            onClick(service);
          }}
        >
          VER DETALLES <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
