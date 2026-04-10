import { showcasedSpecialist } from '../../../data/specialists';
import './SpecialistShowcase.css';

export default function SpecialistShowcase() {
  const { name, specialty, bio, rating, reviews, yearsOfExperience, avatar, portfolio, testimonials } =
    showcasedSpecialist;

  return (
    <section className="showcase">
      <div className="showcase__inner">
        {/* Left — profile */}
        <div className="showcase__profile">
          <img className="showcase__avatar" src={avatar} alt={name} loading="lazy" />
          <div className="showcase__identity">
            <h2 className="showcase__name">{name}</h2>
            <p className="showcase__specialty">{specialty}</p>
            <p className="showcase__bio">{bio}</p>
          </div>

          <div className="showcase__stats">
            <div className="showcase__stat">
              <span className="showcase__stat-value">★ {rating}</span>
              <span className="showcase__stat-label">Rating</span>
            </div>
            <div className="showcase__stat">
              <span className="showcase__stat-value">{reviews}</span>
              <span className="showcase__stat-label">Reseñas</span>
            </div>
            <div className="showcase__stat">
              <span className="showcase__stat-value">{yearsOfExperience}a</span>
              <span className="showcase__stat-label">Experiencia</span>
            </div>
          </div>

          <button className="showcase__cta">Solicitar Servicio</button>
        </div>

        {/* Right — portfolio + testimonials */}
        <div className="showcase__content">
          <div className="showcase__section-header">
            <span className="section-label">Portafolio</span>
            <button className="section-link">Ver todo</button>
          </div>
          <div className="showcase__portfolio">
            {portfolio.map((src, index) => (
              <img
                key={index}
                className="showcase__portfolio-img"
                src={src}
                alt={`Portfolio ${index + 1}`}
                loading="lazy"
              />
            ))}
          </div>

          <div className="showcase__section-header showcase__section-header--mt">
            <span className="section-label">Testimonios</span>
          </div>
          <div className="showcase__testimonials">
            {testimonials.map((t) => (
              <blockquote key={t.id} className="testimonial">
                <div className="testimonial__header">
                  <span className="testimonial__author">{t.author}</span>
                  <span className="testimonial__rating">{'★'.repeat(t.rating)}</span>
                </div>
                <p className="testimonial__text">{t.text}</p>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
