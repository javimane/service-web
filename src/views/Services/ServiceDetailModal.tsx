"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, MapPin, Star, MessageCircle, User } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import "./ServiceDetailModal.css";
import { ROUTES } from "../../routes/paths";
import { incrementProfessionalViewsAction } from "../../app/actions/professionals";

export default function ServiceDetailModal({ service, isOpen, onClose }) {
  const router = useRouter();

  if (!service) return null;

  const professional = service.Professional || service.professional;
  const profile = professional?.Profile || professional?.profile;
  const company = professional?.companies?.[0] || professional?.Companies?.[0];
  const professionalName =
    company?.name || profile?.display_name || "Profesional";
  const avatar =
    profile?.avatar_url ||
    profile?.portfolio_image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(professionalName)}&background=random`;
  const address = professional?.address?.[0] || professional?.Address?.[0];
  const locationName = address?.province?.name || address?.city || "Mendoza";
  const rating = professional?.rating_avg || 0;
  const isVerified = company?.companies_arca?.[0]?.is_verified || false;
  const price = service.base_price
    ? `$${service.base_price.toLocaleString("es-AR")}`
    : "Consultar";

  const professionalId = service.professional_id || professional?.id || "";

  const handleContact = () => {
    onClose();
    router.push(`/messages?to=${professionalId}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Servicio"
      maxWidth="480px"
    >
      <div className="service-detail-modal">
        {/* Professional hero */}
        <div className="service-detail-modal__hero">
          <img
            src={avatar}
            alt={professionalName}
            className="service-detail-modal__avatar"
          />
          <div className="service-detail-modal__info">
            <p className="service-detail-modal__professional">
              {isVerified && (
                <CheckCircle
                  size={14}
                  className="service-detail-modal__verified-icon"
                />
              )}
              {professionalName}
            </p>
            <span className="service-detail-modal__location">
              <MapPin size={13} />
              {locationName}
            </span>
            {rating > 0 && (
              <span className="service-detail-modal__rating">
                <Star size={13} fill="#e94823" color="#e94823" />
                {Number(rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="service-detail-modal__body">
          <h2 className="service-detail-modal__title-large">{service.name}</h2>

          <div className="service-detail-modal__section">
            <p className="service-detail-modal__desc">
              {service.description || "Sin descripción disponible."}
            </p>
          </div>

          <div className="service-detail-modal__section">
            <p className="service-detail-modal__price-large">
              <span>Precio:</span> {price}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="service-detail-modal__footer">
          <button
            className="service-detail-modal__button service-detail-modal__button--primary"
            onClick={handleContact}
          >
            <MessageCircle size={18} />
            Contactar
          </button>
          <Link
            href={`${ROUTES.profile}/${professionalId}`}
            className="service-detail-modal__button service-detail-modal__button--secondary"
            onClick={() => {
              incrementProfessionalViewsAction({ id: professionalId });
              onClose();
            }}
          >
            <User size={18} />
            Ver Perfil
          </Link>
        </div>
      </div>
    </Modal>
  );
}
