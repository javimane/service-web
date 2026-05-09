import { Search, ChevronDown, CheckCircle } from "lucide-react";
import { priceRangeOptions } from "./serviceUtils";
import "./ServicesFilters.css";

export default function ServicesFilters({
  filters,
  categories,
  provinces,
  onFilterChange,
  onReset,
}) {
  return (
    <aside className="services-sidebar">
      {/* Discovery / Search */}
      <div className="filter-group">
        <h3 className="filter-group-label">BÚSQUEDA</h3>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="filter-group">
        <h3 className="filter-group-label">CATEGORÍAS</h3>
        <div className="select-wrapper">
          <select
            value={filters.categoryId}
            onChange={(e) => onFilterChange({ categoryId: e.target.value })}
          >
            <option value="All">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-arrow" />
        </div>
      </div>

      {/* Ubicación */}
      <div className="filter-group">
        <h3 className="filter-group-label">UBICACIÓN</h3>
        <div className="select-wrapper">
          <select
            value={filters.provinceId}
            onChange={(e) =>
              onFilterChange({ provinceId: e.target.value })
            }
          >
            <option value="All">Todas las provincias</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-arrow" />
        </div>
      </div>

      {/* Precio */}
      <div className="filter-group">
        <h3 className="filter-group-label">PRECIO</h3>
        <div className="select-wrapper">
          <select
            value={filters.priceRange}
            onChange={(e) => onFilterChange({ priceRange: e.target.value })}
          >
            {priceRangeOptions.map((range) => (
              <option key={range.id} value={range.id}>
                {range.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-arrow" />
        </div>
      </div>

      {/* Verification Badge */}
      <div className="verification-box">
        <div className="check-icon-wrapper">
          <CheckCircle size={20} fill="#B5FF24" color="#000" />
        </div>
        <div className="verification-text">
          <p>Solo profesionales verificados con licencia activa en Sercio.</p>
        </div>
      </div>

      <button className="reset-sidebar-btn" onClick={onReset}>
        Restablecer filtros
      </button>
    </aside>
  );
}
