"use client";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getServicesAction } from "../../app/actions/services";
import { getServiceCategoriesAction } from "../../app/actions/categories";
import { getProvincesAction } from "../../app/actions/provinces";
import { getDepartmentsAction } from "../../app/actions/locations";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ServiceCard from "../../components/Cards/ServiceCard";
import ServicesFilters from "./ServicesFilters";
import SEO from "../../components/SEO/SEO";
import { ROUTES } from "../../routes/paths";
import { priceRangeOptions } from "./serviceUtils";
import "./ServicesPage.css";

export default function ServicesPage() {
  const [filters, setFilters] = useState({
    name: "",
    categoryId: "All",
    provinceId: "All",
    cityId: "All",
    priceRange: "all",
    isActive: "All",
    type: "all",
    onlyUrgent: false,
    onlyPublic: false,
    onlyVerified: false,
  });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const router = useRouter();

  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["services", filters, page],
    queryFn: async () => {
      const range = priceRangeOptions.find((o) => o.id === filters.priceRange);

      const result = await getServicesAction({
        page,
        limit: 20,
        name: filters.name || undefined,
        categoryId: filters.categoryId !== "All" ? Number(filters.categoryId) : undefined,
        provinceId: filters.provinceId !== "All" ? Number(filters.provinceId) : undefined,
        departmentId: filters.cityId !== "All" ? Number(filters.cityId) : undefined,
        minPrice: range && range.min > 0 ? range.min : undefined,
        maxPrice: range && range.max < Infinity ? range.max : undefined,
        isActive: filters.isActive === "All" ? undefined : filters.isActive === "true" ? true : false,
      });

      return result?.data || { items: [], page: 1, limit: 20, total: 0, totalPages: 1, hasPrev: false, hasNext: false, prevPage: null, nextPage: null };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const servicesData = queryData?.items || [];
  const totalPages = queryData?.totalPages || 1;

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

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", filters.provinceId],
    queryFn: async () => {
      if (filters.provinceId === "All") return [];
      const result = await getDepartmentsAction({
        provinceId: filters.provinceId,
      });
      return result?.data ?? [];
    },
    enabled: filters.provinceId !== "All",
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const handleFilterChange = (updates: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, ...updates };
      // Si cambia la provincia, reseteamos la ciudad
      if (updates.provinceId && updates.provinceId !== prev.provinceId) {
        newFilters.cityId = "All";
      }
      return newFilters;
    });
    setPage(1); // Reset page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      name: "",
      categoryId: "All",
      provinceId: "All",
      cityId: "All",
      priceRange: "all",
      isActive: "All",
      type: "all",
      onlyUrgent: false,
      onlyPublic: false,
      onlyVerified: false,
    });
    setPage(1);
  };

  const currentCategoryName = useMemo(() => {
    if (filters.categoryId === "All") return null;
    const cat = categories.find(
      (c: any) => String(c.id) === String(filters.categoryId),
    );
    return cat ? cat.name : null;
  }, [categories, filters.categoryId]);

  return (
    <div className="services-redesign">
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
          departments={departments}
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
              <>
                <div className={`services-results-grid view-${viewMode}`} style={{ width: "100%", display: viewMode === "grid" ? "grid" : "flex", flexDirection: viewMode === "grid" ? "row" : "column", gap: "var(--space-6)" }}>
                  {servicesData.map((service: any) => (
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
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="store-pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px", width: "100%" }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{ padding: "8px 16px" }}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                      Página {page} de {totalPages}
                    </span>
                    <button
                      className="btn-secondary"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{ padding: "8px 16px" }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
