import { Link } from "react-router-dom";
import {
  CheckCircle,
  MapPin,
  Star,
  MessageCircle,
  User,
} from "lucide-react";
import Modal from "../../components/Modal/Modal";
import "./ServiceDetailModal.css";
import { ROUTES } from "../../routes/paths";

export default function ServiceDetailModal({ service, isOpen, onClose }) {
  if (!service) return null;

  const professional = service.Professional || service.professional;
  const profile = professional?.Profile || professional?.profile;
  const company = professional?.companies?.[0] || professional?.Companies?.[0];
  const professionalName = company?.name || profile?.display_name || "Profesional";
  const avatar = profile?.avatar_url || profile?.portfolio_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(professionalName)}&background=random`;
  const address = professional?.address?.[0] || professional?.Address?.[0];
  const locationName = address?.province?.name || address?.city || "Mendoza";
  const rating = professional?.rating_avg || 0;
  const isVerified = company?.companies_arca?.[0]?.is_verified || false;
  const price = service.base_price ? `$${service.base_price.toLocaleString('es-AR')}` : "Consultar";
  
  const professionalId = service.professional_id || professional?.id || "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${service.name} • ${professionalName}`}
    >
      <div className="service-detail-modal">
        <div className="service-detail-modal__hero">
          <img
            src={avatar}
            alt={professionalName}
            className="service-detail-modal__avatar"
          />
          <div className="service-detail-modal__info">
            <div className="service-detail-modal__category-badge">
              {service.CategoryService?.name || service.category?.name || "General"}
            </div>
            <h3 className="service-detail-modal__title">{service.name}</h3>
            <p className="service-detail-modal__professional">{professionalName}</p>
            <p className="service-detail-modal__location">
              <MapPin size={14} /> {locationName}
            </p>
          </div>
        </div>

        <div className="service-detail-modal__tags">
          <span className={isVerified ? "tag-verified" : ""}>
            <CheckCircle size={16} />
            {isVerified ? "Verificado" : "No verificado"}
          </span>
          <span>
            <Star size={16} fill="#e94823" color="#e94823" /> {rating.toFixed(1)}
          </span>
        </div>

        <div className="service-detail-modal__body">
          <div className="service-detail-modal__section">
            <h4>Descripción</h4>
            <p className="service-detail-modal__desc">{service.description || "Sin descripción disponible."}</p>
          </div>
          <div className="service-detail-modal__section">
            <h4>Inversión estimada</h4>
            <p className="service-detail-modal__price">{price}</p>
          </div>
        </div>

        <div className="service-detail-modal__footer">
          <Link
            to={`${ROUTES.profile}/${professionalId}`}
            className="service-detail-modal__button service-detail-modal__button--secondary"
            onClick={onClose}
          >
            <User size={18} /> Ver perfil
          </Link>
          <Link
            to={`${ROUTES.messages}?receiverId=${professionalId}`}
            className="service-detail-modal__button service-detail-modal__button--primary"
            onClick={onClose}
          >
            <MessageCircle size={18} /> Contactar profesional
          </Link>
        </div>
      </div>
    </Modal>
  );
}
