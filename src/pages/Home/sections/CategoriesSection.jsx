import { categories } from '../../../data/categories';
import CategoryCard from '../../../components/Cards/CategoryCard';
import './CategoriesSection.css';

export default function CategoriesSection() {
  return (
    <section className="categories-section">
      <div className="categories-section__header">
        <span className="section-label">Categorías</span>
        <button className="section-link">Ver todo</button>
      </div>

      <div className="categories-section__scroll">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
