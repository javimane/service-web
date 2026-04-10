import { featuredSpecialists } from '../../../data/specialists';
import SpecialistCard from '../../../components/Cards/SpecialistCard';
import './FeaturedSpecialists.css';

export default function FeaturedSpecialists() {
  return (
    <section className="featured-specialists">
      <div className="featured-specialists__header">
        <span className="section-label">Especialistas Destacados</span>
        <button className="section-link">Ver todo</button>
      </div>

      <div className="featured-specialists__scroll">
        {featuredSpecialists.map((specialist) => (
          <SpecialistCard key={specialist.id} specialist={specialist} />
        ))}
      </div>
    </section>
  );
}
