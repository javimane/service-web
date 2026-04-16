import { Star } from "lucide-react";

export default function TestimonialCard({ name, text, rating = 5, photo }) {
  return (
    <article className="testimonial-card">
      <div className="testimonial-card__header">
        <img src={photo} alt={name} className="testimonial-card__avatar" />
        <div>
          <h4 className="testimonial-card__author">{name}</h4>
          <div className="testimonial-card__stars">
            {Array.from({ length: rating }, (_, index) => (
              <Star key={index} size={14} className="testimonial-card__star" />
            ))}
          </div>
        </div>
      </div>
      <p className="testimonial-card__text">{text}</p>
    </article>
  );
}
