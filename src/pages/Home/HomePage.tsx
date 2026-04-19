import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import CategoriesSection from "./sections/CategoriesSection";
import NearbyServicesSection from "./sections/NearbyServicesSection";
import NearbyProductsSection from "./sections/NearbyProductsSection";
import ProductsCarousel from "./sections/ProductsCarousel";
import PromotionsSection from "./sections/PromotionsSection";
import FeaturedSpecialists from "./sections/FeaturedSpecialists";
import ProfessionalReelsSection from "./sections/ProfessionalReelsSection";
import JoinCTASection from "./sections/JoinCTASection";
import Footer from "../../components/Footer/Footer";
import { ROUTES } from "../../routes/paths";
import "./HomePage.css";

const quickTags = [
  "Plomería",
  "Electricidad",
  "Limpieza",
  "Pintura",
  "Mudanzas",
  "Diseño",
  "Reparaciones",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      navigate(`${ROUTES.services}?q=${encodeURIComponent(heroQuery.trim())}`);
    }
  };

  const handleTagClick = (tag) => {
    navigate(`${ROUTES.services}?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="home-page">
      <Navbar />

      <main className="home-page__main">
        {/* ── Hero ──────────────────────────────────── */}
        <section className="home-hero">
          <div className="home-hero__glow" aria-hidden="true" />
          <div className="home-hero__content">
            <p className="home-hero__eyebrow">
              Tu plataforma de servicios profesionales
            </p>
            <h1 className="home-hero__title">
              ¿Qué necesitas <span className="home-hero__accent">hoy</span>?
            </h1>
            <p className="home-hero__subtitle">
              Encontrá al profesional ideal cerca tuyo. Electricistas, plomeros,
              diseñadores y más — todo en un solo lugar.
            </p>

            <form className="home-hero__search" onSubmit={handleHeroSearch}>
              <Search size={20} className="home-hero__search-icon" />
              <input
                type="text"
                className="home-hero__search-input"
                placeholder="Busca servicios, profesionales, productos..."
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
              />
              <button type="submit" className="home-hero__search-btn">
                Buscar
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="home-hero__tags">
              <span className="home-hero__tags-label">Popular:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="home-hero__tag"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <CategoriesSection />
        <PromotionsSection />
        <NearbyServicesSection />
        <FeaturedSpecialists />
        <NearbyProductsSection />
        <ProfessionalReelsSection />
        <ProductsCarousel />
        <JoinCTASection />
      </main>

      <Footer />
    </div>
  );
}
