import { Star } from "lucide-react";

export default function TestimonialCard({ name, text, rating = 5, photo, commentPhoto }) {
  return (
    <article className="testimonial-card">
      <div className="testimonial-card__header">
        <img 
          src={photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} 
          alt={name} 
          className="testimonial-card__avatar" 
        />
        <div>
          <h4 className="testimonial-card__author">{name}</h4>
          <div className="testimonial-card__stars">
            {Array.from({ length: 5 }, (_, index) => (
              <Star 
                key={index} 
                size={14} 
                className="testimonial-card__star" 
                fill={index < rating ? "currentColor" : "none"}
                color={index < rating ? "var(--highlight)" : "var(--border-color)"}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="testimonial-card__text">{text}</p>
      {commentPhoto && (
        <div className="testimonial-card__image-wrapper">
          <img src={commentPhoto} alt="Review attachment" className="testimonial-card__comment-image" />
        </div>
      )}
    </article>
  );
}
