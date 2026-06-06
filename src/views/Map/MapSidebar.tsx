"use client";
import { useEffect, useState } from "react";
import { Loader2, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getServiceCategoriesAction } from "../../app/actions/categories";
import {
  getProvincesAction,
  getDepartmentsAction,
} from "../../app/actions/locations";
import FilterPanel from "../../components/Filters/FilterPanel";
import type { FilterSection } from "../../components/Filters/FilterPanel";
import "./MapSidebar.css";

export default function MapSidebar({
  onFilterChange,
  specialistsCount,
  isLoading,
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const { data: categories = [], isLoading: isLoadingCats } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const result = await getServiceCategoriesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", selectedProvince],
    queryFn: async () => {
      const result = await getDepartmentsAction({
        provinceId: selectedProvince,
      });
      return result?.data ?? [];
    },
    enabled: !!selectedProvince,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const localFilters = {
    search,
    categoryId: selectedCategory,
    provinceId: selectedProvince,
    departmentId: selectedDepartment,
  };

  const handleApply = () => {
    onFilterChange({
      search,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      provinceId: selectedProvince || undefined,
      departmentId: selectedDepartment || undefined,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleApply();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedProvince, selectedDepartment]);

  const sections: FilterSection[] = [
    {
      type: "search",
      label: "BÚSQUEDA RÁPIDA",
      placeholder: "Nombre o especialidad...",
      filterKey: "search",
    },
    {
      type: "chips",
      label: "CATEGORÍAS",
      filterKey: "categoryId",
      options: [
        { value: "all", label: "Todas" },
        ...categories.map((cat: any) => ({
          value: String(cat.id),
          label: cat.name,
        })),
      ],
    },
    {
      type: "select",
      label: "UBICACIÓN",
      filterKey: "provinceId",
      allLabel: "Todas las provincias",
      options: provinces.map((prov: any) => ({
        value: String(prov.id),
        label: prov.name,
      })),
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    if (key === "search") setSearch(value);
    if (key === "categoryId") setSelectedCategory(value);
    if (key === "provinceId") {
      setSelectedProvince(value);
      setSelectedDepartment("");
    }
  };

  return (
    <aside className="map-sidebar">
      <div className="map-sidebar__header">
        <h2 className="map-sidebar__title">Explorar Profesionales</h2>
        <p className="map-sidebar__subtitle">Encuentra expertos cerca de ti</p>
      </div>

      <FilterPanel
        sections={sections}
        filters={localFilters}
        onFilterChange={handleFilterChange}
      />

      <div className="map-sidebar__footer">
        <div className="map-sidebar__stats">
          <span className="map-sidebar__stats-label">Encontrados:</span>
          <span className="map-sidebar__stats-count">
            {isLoading ? "..." : specialistsCount}
          </span>
        </div>
        <button
          className="map-sidebar__apply-btn"
          onClick={handleApply}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              BUSCANDO...
            </>
          ) : (
            <>
              <Filter size={16} />
              APLICAR FILTROS
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
