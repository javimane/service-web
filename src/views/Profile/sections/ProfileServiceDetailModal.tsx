"use client";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import "../../../views/Services/ServiceDetailModal.css";

interface ProfileServiceDetailModalProps {
  service: any;
  isOpen: boolean;
  onClose: () => void;
  professionalId?: string | number;
}

export default function ProfileServiceDetailModal({
  service,
  isOpen,
  onClose,
  professionalId,
}: ProfileServiceDetailModalProps) {
  const router = useRouter();

  if (!service) return null;

  const price = service.base_price
    ? `$${service.base_price.toLocaleString("es-AR")}`
    : "Consultar";

  const handleContact = () => {
    onClose();
    const serviceUrl = `${window.location.origin}/servicios/${service.seo_path || 'detalle'}?id=${service.id}`;
    const msg = `Hola, qué tal, pregunto por el servicio: ${service.name} - ${serviceUrl}`;
    const encodedMsg = encodeURIComponent(msg);
    router.push(`/mensajes?professionalId=${professionalId}&initialMessage=${encodedMsg}`);
  };

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

        {professionalId && (
          <button className="contact-professional-btn" onClick={handleContact}>
            <MessageCircle size={18} /> CONTACTAR PROFESIONAL
          </button>
        )}
      </div>
    </Modal>
  );
}
