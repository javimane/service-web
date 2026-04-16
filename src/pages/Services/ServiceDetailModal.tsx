import { Link } from "react-router-dom";
import {
  CheckCircle,
  MapPin,
  Star,
  ShieldCheck,
  MessageCircle,
  User,
} from "lucide-react";
import Modal from "../../components/Modal/Modal";
import "./ServiceDetailModal.css";
import { ROUTES } from "../../routes/paths";

export default function ServiceDetailModal({ service, isOpen, onClose }) {
  if (!service) return null;

  const whatsappUrl = `https://wa.me/${service.whatsapp.replace(/[^\d]/g, "")}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${service.specialty} • ${service.name}`}
    >
      <div className="service-detail-modal">
        <div className="service-detail-modal__hero">
          <img
            src={service.avatar}
            alt={service.name}
            className="service-detail-modal__avatar"
          />
          <div>
            <p className="service-detail-modal__subtitle">{service.category}</p>
            <h3>{service.name}</h3>
            <p className="service-detail-modal__location">
              <MapPin size={16} /> {service.city}, {service.province}
            </p>
          </div>
        </div>

        <div className="service-detail-modal__tags">
          <span>
            <CheckCircle size={16} />{" "}
            {service.verified ? "Verificado" : "No verificado"}
          </span>
          <span>
            <ShieldCheck size={16} />{" "}
            {service.licensed ? "Matriculado" : "Sin matrícula"}
          </span>
          <span>
            <Star size={16} /> {service.rating} ({service.reviews} reseñas)
          </span>
        </div>

        <div className="service-detail-modal__body">
          <div className="service-detail-modal__section">
            <h4>Servicio</h4>
            <p>{service.specialty}</p>
          </div>
          <div className="service-detail-modal__section">
            <h4>Precio</h4>
            <p>{service.price}</p>
          </div>
          <div className="service-detail-modal__section">
            <h4>Sobre este profesional</h4>
            <p>{service.description}</p>
          </div>
        </div>

        <div className="service-detail-modal__footer">
          <Link
            to={ROUTES.profile}
            className="service-detail-modal__button service-detail-modal__button--secondary"
            onClick={onClose}
          >
            <User size={18} /> Ver perfil
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="service-detail-modal__button service-detail-modal__button--primary"
          >
            <MessageCircle size={18} /> Contactar profesional
          </a>
        </div>
      </div>
    </Modal>
  );
}
