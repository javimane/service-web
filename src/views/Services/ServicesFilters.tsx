import FilterPanel from "../../components/Filters/FilterPanel";
import type { FilterSection } from "../../components/Filters/FilterPanel";
import { priceRangeOptions } from "./serviceUtils";

export default function ServicesFilters({
  filters,
  categories,
  provinces,
  departments = [],
  onFilterChange,
  onReset,
}) {
  const sections: FilterSection[] = [
    {
      type: "search",
      label: "BÚSQUEDA",
      filterKey: "name",
      placeholder: "Buscar servicio...",
    },
    {
      type: "select",
      label: "CATEGORÍAS",
      filterKey: "categoryId",
      allLabel: "Todas las categorías",
      allValue: "All",
      options: categories.map((cat: any) => ({
        value: String(cat.id),
        label: cat.name,
      })),
    },
    {
      type: "select",
      label: "UBICACIÓN",
      filterKey: "provinceId",
      allLabel: "Todas las provincias",
      allValue: "All",
      options: provinces.map((p: any) => ({
        value: String(p.id),
        label: p.name,
      })),
    },
    {
      type: "select",
      label: "CIUDAD / DEPARTAMENTO",
      filterKey: "cityId",
      allLabel: "Todas las ciudades",
      allValue: "All",
      options: departments.map((d: any) => ({
        value: String(d.id),
        label: d.name,
      })),
    },
    {
      type: "price-select",
      label: "PRECIO",
      filterKey: "price",
      options: priceRangeOptions,
    },
    { type: "reset" },
  ];

  return (
    <FilterPanel
      className="services-filters"
      sections={sections}
      filters={filters}
      onFilterChange={(key, value) => onFilterChange({ [key]: value })}
      onReset={onReset}
    />
  );
}
