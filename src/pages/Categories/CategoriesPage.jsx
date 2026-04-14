import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import CategoryProfileCard from "../../components/Cards/CategoryProfileCard";
import { categories } from "../../data/categories";
import { ChevronDown, Search } from "lucide-react";
import "./CategoriesPage.css";

const provinces = ["Buenos Aires", "Córdoba", "Mendoza", "Capital Federal"];
const experienceLevels = ["JUNIOR", "SENIOR", "EXPERT", "LEAD"];

export default function CategoriesPage() {
  const [selectedExperience, setSelectedExperience] = useState("SENIOR");
  const [isMatriculado, setIsMatriculado] = useState(false);

  return (
    <div className="categories-page">
      <Navbar />

      <main className="categories-page__main">
        <header className="categories-page__hero">
          <div className="container">
            <h1 className="hero__title">
              Arquitectura <br />
              <span className="hero__title--italic">de Talento</span>
            </h1>
            <p className="hero__description">
              Navega por una red curada de especialistas de alto nivel. Desde la 
              ingeniería estructural hasta el diseño de interiores, cada servicio 
              está diseñado con precisión arquitectónica.
            </p>
          </div>
        </header>

        <section className="categories-page__content container">
          <aside className="sidebar">
            <div className="filter-section">
              <h4 className="filter-section__label">CATEGORÍA</h4>
              <div className="filter-list">
                {categories.slice(0, 4).map((cat) => (
                  <label key={cat.id} className="filter-checkbox">
                    <input type="checkbox" defaultChecked={cat.id === 1} />
                    <span className="checkbox-custom"></span>
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4 className="filter-section__label">UBICACIÓN</h4>
              <div className="dropdown">
                <span>Provincia</span>
                <ChevronDown size={16} />
              </div>
              <div className="dropdown">
                <span>Ciudad</span>
                <ChevronDown size={16} />
              </div>
            </div>

            <div className="filter-section">
              <h4 className="filter-section__label">EXPERIENCIA</h4>
              <div className="experience-grid">
                {experienceLevels.map((level) => (
                  <button
                    key={level}
                    className={`experience-btn ${selectedExperience === level ? 'active' : ''}`}
                    onClick={() => setSelectedExperience(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-checkbox">
                <input 
                  type="checkbox" 
                  checked={isMatriculado} 
                  onChange={() => setIsMatriculado(!isMatriculado)} 
                />
                <span className="checkbox-custom"></span>
                Especialista Matriculado
              </label>
            </div>

            <div className="verified-promo">
              <div className="verified-promo__header">
                <div className="verified-icon">
                  <div className="verified-icon__inner"></div>
                </div>
                <span>OBSIDIAN VERIFIED</span>
              </div>
              <p>Accede solo a profesionales que han superado nuestras pruebas de precisión técnica y rigor estético.</p>
            </div>
          </aside>

          <div className="categories-grid-container">
            <div className="categories-grid">
              {categories.map((category) => (
                <CategoryProfileCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

