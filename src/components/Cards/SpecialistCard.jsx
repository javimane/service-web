import './SpecialistCard.css';

export default function SpecialistCard({ specialist }) {
  const { name, specialty, rating, reviews, priceRange, available, avatar } = specialist;

  return (
    <article className="specialist-card">
      <div className="specialist-card__top">
        <img
          className="specialist-card__avatar"
          src={avatar}
          alt={name}
          loading="lazy"
        />
        <div className="specialist-card__info">
          <h3 className="specialist-card__name">{name}</h3>
          <span className="specialist-card__specialty">{specialty}</span>
        </div>
        <span className={`specialist-card__badge ${available ? 'specialist-card__badge--available' : 'specialist-card__badge--busy'}`}>
          {available ? 'Disponible' : 'Ocupado'}
        </span>
      </div>

      <div className="specialist-card__bottom">
        <div className="specialist-card__stat">
          <span className="specialist-card__rating">★ {rating}</span>
          <span className="specialist-card__reviews">{reviews} reseñas</span>
        </div>
        <span className="specialist-card__price">{priceRange}</span>
      </div>
    </article>
  );
}
