"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, MapPin } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import { getProvincesAction } from "@/app/actions/provinces";
import Navbar from "../../components/Navbar/Navbar";
import CategoriesSection from "./sections/CategoriesSection";
import BannerCarousel from "./sections/BannerCarousel";
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
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");
  const [userProvince, setUserProvince] = useState("Buenos Aires");
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userProvince");
      if (stored) {
        setUserProvince(stored);
      }
    }
  }, []);

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  const handleProvinceSelect = (provinceName) => {
    setUserProvince(provinceName);
    if (typeof window !== "undefined") {
      localStorage.setItem("userProvince", provinceName);
    }
    setIsProvinceModalOpen(false);
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      router.push(
        `${ROUTES.services}?q=${encodeURIComponent(heroQuery.trim())}`,
      );
    }
  };

  const handleTagClick = (tag) => {
    router.push(`${ROUTES.services}?q=${encodeURIComponent(tag)}`);
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
              <button
                type="button"
                className="home-hero__location-btn"
                onClick={() => setIsProvinceModalOpen(true)}
              >
                <MapPin size={16} />
                <span className="home-hero__location-text">{userProvince}</span>
              </button>
              <button type="submit" className="home-hero__search-btn">
                Buscar
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="home-hero__tags">
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

        <BannerCarousel />
        <CategoriesSection />
        <PromotionsSection userProvince={userProvince} />
        <NearbyServicesSection userProvince={userProvince} />
        <FeaturedSpecialists userProvince={userProvince} />
        <NearbyProductsSection userProvince={userProvince} />
        <ProfessionalReelsSection userProvince={userProvince} />
        <ProductsCarousel />
        <JoinCTASection />
      </main>

      <Footer />

      <Modal
        isOpen={isProvinceModalOpen}
        onClose={() => setIsProvinceModalOpen(false)}
        title="Seleccionar Ubicación"
      >
        <div className="province-selector">
          <p className="province-selector__hint">
            Mostraremos contenido destacado disponible en la provincia que
            elijas.
          </p>
          <div className="province-selector__grid">
            {provinces.map((prov: any) => (
              <button
                key={prov.id}
                className={`province-chip ${userProvince === prov.name ? "active" : ""}`}
                onClick={() => handleProvinceSelect(prov.name)}
              >
                {prov.name}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
