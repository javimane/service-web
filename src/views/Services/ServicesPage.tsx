"use client";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getServicesAction } from "../../app/actions/services";
import { getServiceCategoriesAction } from "../../app/actions/categories";
import { getProvincesAction } from "../../app/actions/provinces";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ServiceCard from "../../components/Cards/ServiceCard";
import ServicesFilters from "./ServicesFilters";
import SEO from "../../components/SEO/SEO";
import { useTheme } from "../../context/ThemeContext";
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
  const { theme } = useTheme();
  const router = useRouter();

  const {
    data: servicesData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["services", filters],
    queryFn: async () => {
      const result = await getServicesAction({
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.categoryId === "All"
          ? {}
          : { categoryId: filters.categoryId }),
        ...(filters.provinceId === "All"
          ? {}
          : { provinceId: filters.provinceId }),
        ...(filters.cityId === "All" ? {} : { cityId: filters.cityId }),
        ...(filters.type === "all" ? {} : { type: filters.type }),
        ...(filters.onlyUrgent ? { onlyUrgent: true } : {}),
        ...(filters.onlyPublic ? { onlyPublic: true } : {}),
        ...(filters.onlyVerified ? { onlyVerified: true } : {}),
      });

      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const result = await getServiceCategoriesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24,
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
    const cat = categories.find(
      (c: any) => String(c.id) === String(filters.categoryId),
    );
    return cat ? cat.name : null;
  }, [categories, filters.categoryId]);

  return (
    <div className={`services-redesign ${theme === "dark" ? "dark" : ""}`}>
      <SEO
        title={
          currentCategoryName
            ? `${currentCategoryName} - Servicios Profesionales`
            : "Servicios Profesionales - Encontrá al experto que necesitás"
        }
        description={
          currentCategoryName
            ? `Buscá expertos en ${currentCategoryName}. Servicios verificados, presupuestos y contacto directo.`
            : "Catálogo de servicios profesionales. Plomería, electricidad, diseño, gas y más servicios verificados."
        }
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
                <p>
                  {(error as any)?.message?.includes("404")
                    ? "El catálogo no está disponible en este momento (404)."
                    : "Ocurrió un error inesperado."}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="reset-btn"
                >
                  Reintentar
                </button>
              </div>
            ) : servicesData.length === 0 ? (
              <div className="services-empty-state">
                <div className="referral-banner">
                  <div className="referral-banner__content">
                    <h3>¡Hacé crecer la comunidad!</h3>
                    <p>
                      Unite a la red de referidos para agrandar la comunidad y
                      ganá <strong>$5.000</strong> por cada usuario que se
                      registre.
                    </p>
                  </div>
                  <button
                    className="referral-banner__btn"
                    onClick={() =>
                      router.push(`${ROUTES.dashboard}?view=referrals`)
                    }
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
                  onClick={(svc) => {
                    const slug = svc.name
                      ? svc.name.trim().toLowerCase().replace(/\s+/g, "-")
                      : `service-${svc.id}`;
                    router.push(`/servicios/${slug}?id=${svc.id}`);
                  }}
                />
              ))
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
