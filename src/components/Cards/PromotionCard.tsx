import { Ticket } from "lucide-react";
import "./PromotionCard.css";

export default function PromotionCard({ promotion, onClick }) {
  const { title, professionalName, offer, image } = promotion;

  return (
    <article 
      className="promotion-card" 
      onClick={() => onClick(promotion)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(promotion);
        }
      }}
    >
      <div className="promotion-card__image-container">
        <img src={image} alt={title} className="promotion-card__image" loading="lazy" draggable="false" />
        <div className="promotion-card__badge">
          <Ticket size={14} className="promotion-card__badge-icon" />
          <span className="promotion-card__offer-text">{offer}</span>
        </div>
      </div>
      
      <div className="promotion-card__content">
        <h3 className="promotion-card__title">{title}</h3>
        <p className="promotion-card__professional">{professionalName}</p>
        <div className="promotion-card__action-text">Ver promoción</div>
      </div>
    </article>
  );
}
