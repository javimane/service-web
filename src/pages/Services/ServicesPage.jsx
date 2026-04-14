import { useMemo, useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { professionals } from "../../data/specialists";
import ServiceCard from "../../components/Cards/ServiceCard";
import ServicesFilters from "./ServicesFilters";
import ServiceDetailModal from "./ServiceDetailModal";
import { filterServices, getUniqueValues } from "./serviceUtils";
import "./ServicesPage.css";

export default function ServicesPage() {
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    province: "All",
    city: "All",
    priceRange: "all",
  });
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [selectedService, setSelectedService] = useState(null);

  // Sync title and dark mode class for this specific page
  useEffect(() => {
    document.title = "Servicios Individuales | Obsidian Pro";
    document.documentElement.classList.add('dark-theme');
    return () => {
      document.documentElement.classList.remove('dark-theme');
    };
  }, []);

  const categories = useMemo(
    () => getUniqueValues(professionals, "category"),
    [],
  );
  const provinces = useMemo(
    () => getUniqueValues(professionals, "province"),
    [],
  );
  const cities = useMemo(() => {
    const items =
      filters.province === "All"
        ? professionals
        : professionals.filter((item) => item.province === filters.province);
    return getUniqueValues(items, "city");
  }, [filters.province]);

  const filteredServices = useMemo(
    () => filterServices(professionals, filters),
    [filters],
  );

  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "All",
      province: "All",
      city: "All",
      priceRange: "all",
    });
  };

  return (
    <div className="services-redesign">
      <Navbar />

      <div className="services-layout">
        <ServicesFilters
          filters={filters}
          categories={categories}
          provinces={provinces}
          cities={cities}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <main className="services-main">
          <header className="services-header">
            <div className="services-header__left">
              <h1 className="services-title">Servicios Individuales</h1>
              <p className="services-subtitle">
                Catálogo curado de excelencia técnica y arquitectónica.
              </p>
            </div>

            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Vista Cuadrícula"
              >
                <LayoutGrid size={18} />
                <span>Grid</span>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="Vista Lista"
              >
                <List size={18} />
                <span>List</span>
              </button>
            </div>
          </header>

          <div className={`services-results view-${viewMode}`}>
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                viewMode={viewMode}
                onClick={setSelectedService}
              />
            ))}
            
            {filteredServices.length === 0 && (
              <div className="services-empty">
                <div className="services-empty__icon">🔍</div>
                <h3>No se encontraron resultados</h3>
                <p>Intenta ajustar los filtros para encontrar lo que buscas.</p>
                <button onClick={handleResetFilters} className="reset-btn">
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>

          {filteredServices.length > 0 && (
            <div className="explore-more">
              <button className="explore-btn">
                Explorar más servicios
                <span className="chevron-down"></span>
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />

      <ServiceDetailModal
        service={selectedService}
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
}
