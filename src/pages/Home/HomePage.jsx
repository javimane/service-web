import Navbar from '../../components/Navbar/Navbar';
import CategoriesSection from './sections/CategoriesSection';
import FeaturedSpecialists from './sections/FeaturedSpecialists';
import SpecialistShowcase from './sections/SpecialistShowcase';
import JoinCTASection from './sections/JoinCTASection';
import Footer from '../../components/Footer/Footer';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <Navbar />

      <main className="home-page__main">
        <div className="home-page__hero">
          <h1 className="home-page__hero-title">¿Qué necesitas hoy?</h1>
        </div>

        <CategoriesSection />
        <FeaturedSpecialists />
        <SpecialistShowcase />
        <JoinCTASection />
      </main>

      <Footer />
    </div>
  );
}
