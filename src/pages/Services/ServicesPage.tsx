import { useMemo, useState, useEffect } from "react";
import { LayoutGrid, List, Loader2, Search, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { serviceService } from "../../services/serviceService";
import { categoriesService } from "../../services/categoriesApi";
import { locationService } from "../../services/locationService";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ServiceCard from "../../components/Cards/ServiceCard";
import ServicesFilters from "./ServicesFilters";
import ServiceDetailModal from "./ServiceDetailModal";
import SEO from "../../components/SEO/SEO";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
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
  const navigate = useNavigate();

  const { data: servicesData = [], isLoading, isError, error } = useQuery({
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

  const currentCategoryName = useMemo(() => {
    if (filters.categoryId === "All") return null;
    const cat = categories.find((c: any) => String(c.id) === String(filters.categoryId));
    return cat ? cat.name : null;
  }, [categories, filters.categoryId]);

  return (
    <div className={`services-redesign ${theme === "dark" ? "dark" : ""}`}>
      <SEO 
        title={currentCategoryName ? `${currentCategoryName} - Servicios Profesionales` : "Servicios Profesionales - Encontrá al experto que necesitás"}
        description={currentCategoryName 
          ? `Buscá expertos en ${currentCategoryName}. Servicios verificados, presupuestos y contacto directo.` 
          : "Catálogo de servicios profesionales. Plomería, electricidad, diseño, gas y más servicios verificados."}
      />
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
              <div className="services-loading-premium">
                <div className="premium-spinner"></div>
                <p>Cargando catálogo de excelencia...</p>
              </div>
            ) : isError ? (
              <div className="services-error">
                <AlertTriangle size={48} />
                <h3>Error al cargar servicios</h3>
                <p>{(error as any)?.message?.includes('404') ? 'El catálogo no está disponible en este momento (404).' : 'Ocurrió un error inesperado.'}</p>
                <button onClick={() => window.location.reload()} className="reset-btn">
                  Reintentar
                </button>
              </div>
            ) : servicesData.length === 0 ? (
              <div className="services-empty-state">
                <div className="referral-banner">
                  <div className="referral-banner__content">
                    <h3>¡Hacé crecer la comunidad!</h3>
                    <p>Unite a la red de referidos para agrandar la comunidad y ganá <strong>$5.000</strong> por cada usuario que se registre.</p>
                  </div>
                  <button 
                    className="referral-banner__btn"
                    onClick={() => navigate(ROUTES.dashboard, { state: { view: "referrals" } })}
                  >
                    Ir a Referidos
                  </button>
                </div>
                
                <div className="services-empty">
                  <div className="services-empty__icon">
                    <Search size={48} />
                  </div>
                  <h3>No se encontraron resultados</h3>
                  <p>Ajustá los filtros para encontrar lo que buscás.</p>
                  <button onClick={handleResetFilters} className="reset-btn">
                    Limpiar filtros
                  </button>
                </div>
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
