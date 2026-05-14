import Link from "next/link";
import "./SpecialistCard.css";
import { ROUTES } from "../../routes/paths";

const SPECIALTY_COLORS: Record<string, string> = {
  'Diseñador': '#1e3a8a',
  'Diseñadora': '#1e3a8a',
  'Interior Design': '#1e3a8a',
  'Plomero': '#0d9488',
  'Engineering': '#0d9488',
  'Tutor': '#f97316',
  'Tutora': '#f97316',
  'Smart Systems': '#2dd4bf',
};

export default function SpecialistCard({ specialist }) {
  const { name, specialty, rating, avatar } = specialist;

  // Find a color based on specialty string matching
  const headerColor = Object.entries(SPECIALTY_COLORS).find(([key]) => 
    specialty.toLowerCase().includes(key.toLowerCase())
  )?.[1] || '#2dd4bf';

  return (
    <article className="specialist-card">
      <div 
        className="specialist-card__header" 
        style={{ backgroundColor: headerColor }}
      />
      
      <div className="specialist-card__avatar-wrap">
        <Link href={specialist.seoPath || `${ROUTES.profile}/${specialist.id}`}>
          <img
            className="specialist-card__avatar"
            src={avatar}
            alt={name}
            loading="lazy"
          />
        </Link>
      </div>
  
      <div className="specialist-card__body">
        <Link href={specialist.seoPath || `${ROUTES.profile}/${specialist.id}`} className="specialist-card__link">
          <h3 className="specialist-card__name">{name}</h3>
        </Link>
        <span className="specialist-card__specialty">{specialty}</span>
      </div>

      <div className="specialist-card__footer">
        <div className="specialist-card__rating-stars">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>
        <div className="specialist-card__rating-value">
          {rating}
        </div>
      </div>
    </article>
  );
}
