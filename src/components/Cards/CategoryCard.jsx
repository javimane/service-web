import './CategoryCard.css';

export default function CategoryCard({ category }) {
  const { label, specialists, image } = category;

  return (
    <article className="category-card">
      <img
        className="category-card__image"
        src={image}
        alt={label}
        loading="lazy"
      />
      <div className="category-card__overlay" />
      <div className="category-card__body">
        <h3 className="category-card__name">{label}</h3>
        <span className="category-card__count">{specialists} Especialistas</span>
      </div>
    </article>
  );
}
