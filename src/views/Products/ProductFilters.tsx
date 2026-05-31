"use client";
import { X } from "lucide-react";
import FilterPanel from "../../components/Filters/FilterPanel";
import type { FilterSection } from "../../components/Filters/FilterPanel";
import "./ProductFilters.css";

export default function ProductFilters({
  filters,
  categories,
  provinces,
  onFilterChange,
  onClear,
  showFilters,
  onToggle,
  professionalIdParam,
  searchParams,
  pathname,
  router,
}) {
  const sections: FilterSection[] = [
    {
      type: "chips",
      label: "Origen",
      filterKey: "is_foreign",
      options: [
        { value: "all", label: "Todos" },
        { value: "internal", label: "Locales" },
        { value: "external", label: "Externos" },
      ],
    },
    {
      type: "select",
      label: "Provincia",
      filterKey: "provinceId",
      allLabel: "Todas las provincias",
      allValue: "all",
      options: provinces.map((p: any) => ({
        value: String(p.id),
        label: p.name,
      })),
    },
    {
      type: "select",
      label: "Categoría",
      filterKey: "categoryId",
      allLabel: "Todas las categorías",
      allValue: "all",
      options: categories.map((c: any) => ({
        value: String(c.id),
        label: c.name,
      })),
    },
    {
      type: "text",
      label: "Marca",
      filterKey: "brand",
      placeholder: "Ej: Samsung",
    },
    {
      type: "text",
      label: "EAN",
      filterKey: "ean",
      placeholder: "Ej: 7791234567890",
      inputMode: "numeric",
      transform: (value: string) => value.replace(/\D/g, ""),
    },
    {
      type: "price-range",
      label: "Rango de precio",
    },
    { type: "reset", label: "Limpiar Filtros" },
  ];

  return (
    <aside className={`products-sidebar ${showFilters ? "active" : ""}`}>
      <div className="products-sidebar__header">
        <h3>Filtros</h3>
        <button
          className="close-filters-btn"
          onClick={() => onToggle(false)}
          aria-label="Cerrar filtros"
        >
          <X size={20} />
        </button>
      </div>

      <FilterPanel
        sections={sections}
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onClear}
      />

      {professionalIdParam && (
        <div className="products-sidebar__prof-badge">
          <span>Filtrando por profesional</span>
          <button
            onClick={() => {
              const newParams = new URLSearchParams(
                searchParams?.toString() ?? "",
              );
              newParams.delete("professionalId");
              router.replace(`${pathname}?${newParams.toString()}`);
            }}
            aria-label="Quitar filtro de profesional"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </aside>
  );
}
