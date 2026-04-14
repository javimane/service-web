import { Check, Zap } from "lucide-react";
import "./CategoryProfileCard.css";

export default function CategoryCard({ category, onClick, active }) {
  const { label, specialists, image, type, status } = category;

  // Mock avatars for the stack
  const avatars = [
    "https://i.pravatar.cc/150?u=1",
    "https://i.pravatar.cc/150?u=2",
    "https://i.pravatar.cc/150?u=3"
  ];

  return (
    <article
      className={`category-card${status === 'VERIFIED' ? ' category-card--verified' : ''}`}
      onClick={onClick}
    >
      <div className="category-card__image-container">
        <img
          className="category-card__image"
          src={image}
          alt={label}
          loading="lazy"
        />
        <div className="category-card__badge">
          {status === 'VERIFIED' ? (
            <span className="badge badge--verified">
              <Check size={10} /> VERIFIED
            </span>
          ) : (
            <span className="badge badge--active">
              <Zap size={10} fill="currentColor" /> ACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="category-card__content">
        <div className="category-card__header">
          <div className="category-card__title-group">
            <h3 className="category-card__name">{label}</h3>
            <p className="category-card__type">{type}</p>
          </div>
          <div className="category-card__stats">
            <span className="category-card__count">{specialists}</span>
            <span className="category-card__count-label">EXPERTS</span>
          </div>
        </div>

        <div className="category-card__footer">
          <div className="avatar-stack">
            {avatars.map((url, i) => (
              <img key={i} src={url} alt="Expert" className="avatar-stack__item" />
            ))}
            <span className="avatar-stack__more">+{specialists - 3}</span>
          </div>
          <button className="category-card__button" onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}>
            Explore Category
          </button>
        </div>
      </div>
    </article>
  );
}

