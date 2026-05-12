import { useMemo, useState, useEffect } from "react";
import { LayoutGrid, List, Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { serviceService } from "../../services/serviceService";
import { categoriesService } from "../../services/categoriesApi";
import { locationService } from "../../services/locationService";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ServiceCard from "../../components/Cards/ServiceCard";
import ServicesFilters from "./ServicesFilters";
import ServiceDetailModal from "./ServiceDetailModal";
import { useTheme } from "../../context/ThemeContext";
import "./ServicesPage.css";

export default function ServicesPage() {
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "All",
    provinceId: "All",
    cityId: "All",
    type: "all",
    onlyUrgent: false,
    onlyPublic: false,
    onlyVerified: false,
  });
  const [viewMode, setViewMode] = useState("grid");
  const [selectedService, setSelectedService] = useState(null);
  const { theme } = useTheme();

  const { data: servicesData = [], isLoading } = useQuery({
    queryKey: ["services", filters],
    queryFn: () => serviceService.list({
      search: filters.search || undefined,
      categoryId: filters.categoryId === "All" ? undefined : filters.categoryId,
      provinceId: filters.provinceId === "All" ? undefined : filters.provinceId,
      cityId: filters.cityId === "All" ? undefined : filters.cityId,
      type: filters.type === "all" ? undefined : filters.type,
      onlyUrgent: filters.onlyUrgent || undefined,
      onlyPublic: filters.onlyPublic || undefined,
      onlyVerified: filters.onlyVerified || undefined,
    }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: () => categoriesService.listCategories(),
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: () => locationService.getProvinces(),
  });

  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      categoryId: "All",
      provinceId: "All",
      cityId: "All",
      type: "all",
      onlyUrgent: false,
      onlyPublic: false,
      onlyVerified: false,
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
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Vista Cuadrícula"
              >
                <LayoutGrid size={18} />
                <span>Grid</span>
              </button>
              <button
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="Vista Lista"
              >
                <List size={18} />
                <span>List</span>
              </button>
            </div>
          </header>

          <div className={`services-results view-${viewMode}`}>
            {isLoading ? (
              <div className="services-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Cargando catálogo de servicios...</p>
              </div>
            ) : servicesData.length === 0 ? (
              <div className="services-empty">
                <div className="services-empty__icon">
                  <Search size={48} />
                </div>
                <h3>No se encontraron resultados</h3>
                <p>Intenta ajustar los filtros para encontrar lo que buscas.</p>
                <button onClick={handleResetFilters} className="reset-btn">
                  Limpiar todos los filtros
                </button>
              </div>
            ) : (
              servicesData.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  viewMode={viewMode}
                  onClick={setSelectedService}
                />
              ))
            )}
          </div>

          {servicesData.length > 0 && (
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
