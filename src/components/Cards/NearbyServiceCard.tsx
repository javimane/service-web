import { MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./NearbyServiceCard.css";

export default function NearbyServiceCard({ service, onClick }) {
  const navigate = useNavigate();
  const { id, name, avatar, description, price, distance, rating, reviews } =
    service;

  const handleClick = () => {
    if (onClick) {
      onClick(service);
    } else {
      navigate(`/profile/${id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className="nearby-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="nearby-card__header">
        <div className="nearby-card__avatar-wrapper">
          <img
            src={avatar}
            alt={name}
            className="nearby-card__avatar"
            draggable="false"
          />
        </div>
        <div className="nearby-card__status">
          <span className="nearby-card__distance">
            <MapPin size={12} /> {distance}
          </span>
        </div>
      </div>

      <div className="nearby-card__body">
        <h3 className="nearby-card__name">{name}</h3>
        <p className="nearby-card__description">{description}</p>

        <div className="nearby-card__rating">
          <Star size={14} className="nearby-card__star" fill="currentColor" />
          <span className="nearby-card__score">{rating}</span>
          <span className="nearby-card__reviews">({reviews})</span>
        </div>
      </div>

      <div className="nearby-card__footer">
        <div className="nearby-card__price">
          <span className="nearby-card__price-label">Desde</span>
          <span className="nearby-card__price-value">{price}</span>
        </div>
      </div>
    </article>
  );
}
