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
      title="Detalle del Servicio"
      maxWidth="450px"
    >
      <div className="service-detail-modal">
        <div className="service-detail-modal__body">
          <h2 className="service-detail-modal__title-large">{service.name}</h2>
          
          <div className="service-detail-modal__section">
            <p className="service-detail-modal__desc">{service.description || "Sin descripción disponible."}</p>
          </div>

          <div className="service-detail-modal__section">
            <p className="service-detail-modal__price-large">
              <span>Inversión:</span> {price}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
