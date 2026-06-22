"use client";
import FilterPanel from "../../components/Filters/FilterPanel";
import type { FilterSection } from "../../components/Filters/FilterPanel";
import "./CategoriesFilters.css";

type AccountType = "Todos" | "Comercio" | "Autónomo";

const accountTypes: AccountType[] = ["Todos", "Comercio", "Autónomo"];

interface CategoriesFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  selectedProvince: string;
  selectedCity: string;
  selectedAccountType: AccountType;
  categoryOptions: { label: string }[];
  provinceOptions: string[];
  cityOptions: string[];
  selectedProvinceId: number | null;
  urgentOnly: boolean;
  publicStoreOnly: boolean;
  verifiedOnly: boolean;
  matriculatedOnly: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onAccountTypeChange: (value: AccountType) => void;
  onToggleChange: (key: string, value: boolean) => void;
  onReset: () => void;
}

export default function CategoriesFilters({
  searchTerm,
  selectedCategory,
  selectedProvince,
  selectedCity,
  selectedAccountType,
  categoryOptions,
  cityOptions,
  selectedProvinceId,
  urgentOnly,
  publicStoreOnly,
  verifiedOnly,
  matriculatedOnly,
  onSearchChange,
  onCategoryChange,
  onProvinceChange,
  onCityChange,
  onAccountTypeChange,
  provinceOptions,
  onToggleChange,
  onReset,
}: CategoriesFiltersProps) {
  const sections: FilterSection[] = [
    {
      type: "search",
      label: "BÚSQUEDA",
      placeholder: "Buscar nombre, rubro, o especialidad...",
      filterKey: "name",
    },
    {
      type: "dropdown-select",
      label: "CATEGORÍA",
      filterKey: "categoryId",
      placeholder: "Profesiones y Oficios",
      options: [
        { value: "Todas", label: "Todas" },
        ...categoryOptions
          .filter((c) => c.label !== "Todas")
          .map((c) => ({ value: c.label, label: c.label }))
      ],
    },
    {
      type: "dropdown-select",
      label: "PROVINCIA",
      filterKey: "provinceId",
      placeholder: "Todas las provincias",
      options: [
        { value: "Todas", label: "Todas" },
        ...provinceOptions
          .filter((p) => p !== "Todas")
          .map((p) => ({ value: p, label: p }))
      ],
    },
    {
      type: "reset",
      label: "Limpiar filtros",
    },
  ];

  const filters = {
    name: searchTerm,
    categoryId: selectedCategory,
    provinceId: selectedProvince,
  };

  const handleFilterChange = (key: string, value: any) => {
    switch (key) {
      case "name":
        onSearchChange(value);
        break;
      case "categoryId":
        onCategoryChange(value);
        break;
      case "provinceId":
        onProvinceChange(value);
        break;
    }
  };

  const provinceSelectOptions = [];

  return (
    <aside className="categories-sidebar">
      <div className="categories-sidebar__header">
        <h2 className="categories-sidebar__title">
          Encontrá a tu profesional
        </h2>
        <p className="categories-sidebar__subtitle">
          Ajustá la búsqueda por categoría, ubicación y tipo de perfil.
        </p>
      </div>

      <FilterPanel
        sections={sections}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={onReset}
      />

      <div className="filter-section">
        <span className="filter-section__label">CIUDAD</span>
        <div className="filter-section__select-wrapper">
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!selectedProvinceId}
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c === "Todas" ? "Todas las ciudades" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-section">
        <span className="filter-section__label">TIPO DE PERFIL</span>
        <div className="profile-type-switcher">
          {accountTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`profile-type-btn ${selectedAccountType === type ? "active" : ""}`}
              onClick={() => onAccountTypeChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="preferences-box">
        <span className="filter-section__label">PREFERENCIAS</span>
        <div className="preferences-list">
          {[
            { key: "urgentOnly", label: "SOLO URGENCIAS", checked: urgentOnly },
            { key: "publicStoreOnly", label: "COMERCIO AL PÚBLICO", checked: publicStoreOnly },
            { key: "verifiedOnly", label: "SOLO VERIFICADOS", checked: verifiedOnly },
            { key: "matriculatedOnly", label: "SOLO MATRICULADOS", checked: matriculatedOnly },
          ].map((pref) => (
            <div key={pref.key} className="pref-row">
              <label className="ios-toggle">
                <input
                  type="checkbox"
                  checked={pref.checked}
                  onChange={() => onToggleChange(pref.key, !pref.checked)}
                />
                <span className="ios-toggle__slider" />
              </label>
              <span className="pref-label">{pref.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
