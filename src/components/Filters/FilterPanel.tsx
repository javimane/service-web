"use client";
import { Search, ChevronDown, RotateCcw } from "lucide-react";
import "./FilterPanel.css";

type SectionBase = {
  id?: string;
  label?: string;
};

type SearchSection = SectionBase & {
  type: "search";
  placeholder?: string;
  filterKey?: string;
};

type SelectSection = SectionBase & {
  type: "select";
  options: { value: string; label: string }[];
  filterKey: string;
  allLabel?: string;
  allValue?: string;
};

type ChipsSection = SectionBase & {
  type: "chips";
  options: { value: string; label: string }[];
  filterKey: string;
};

type TextSection = SectionBase & {
  type: "text";
  filterKey: string;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  transform?: (value: string) => string;
};

type PriceRangeSection = SectionBase & {
  type: "price-range";
  minFilterKey?: string;
  maxFilterKey?: string;
};

type PriceSelectSection = SectionBase & {
  type: "price-select";
  options: { id: string; label: string }[];
  filterKey?: string;
};

type ResetSection = SectionBase & {
  type: "reset";
  label?: string;
};

export type FilterSection =
  | SearchSection
  | SelectSection
  | ChipsSection
  | TextSection
  | PriceRangeSection
  | PriceSelectSection
  | ResetSection;

interface FilterPanelProps {
  sections: FilterSection[];
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onReset?: () => void;
  className?: string;
}

function renderSection(
  section: FilterSection,
  filters: Record<string, any>,
  onFilterChange: (key: string, value: any) => void,
) {
  switch (section.type) {
    case "search": {
      const key = section.filterKey || "search";
      return (
        <div className="filter-panel__section" key={section.id || "search"}>
          {section.label && (
            <span className="filter-panel__label">{section.label}</span>
          )}
          <div className="filter-panel__search">
            <Search size={18} className="filter-panel__search-icon" />
            <input
              type="text"
              placeholder={section.placeholder || "Buscar..."}
              value={filters[key] || ""}
              onChange={(e) => onFilterChange(key, e.target.value)}
            />
          </div>
        </div>
      );
    }

    case "select": {
      return (
        <div className="filter-panel__section" key={section.id || section.filterKey}>
          {section.label && (
            <span className="filter-panel__label">{section.label}</span>
          )}
          <div className="filter-panel__select-wrapper">
            <select
              value={filters[section.filterKey] || ""}
              onChange={(e) => onFilterChange(section.filterKey, e.target.value)}
            >
              {section.allLabel && (
                <option value={section.allValue ?? ""}>{section.allLabel}</option>
              )}
              {section.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="filter-panel__select-arrow" />
          </div>
        </div>
      );
    }

    case "chips": {
      return (
        <div className="filter-panel__section" key={section.id || section.filterKey}>
          {section.label && (
            <span className="filter-panel__label">{section.label}</span>
          )}
          <div className="filter-panel__chips">
            {section.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`filter-panel__chip ${filters[section.filterKey] === opt.value ? "filter-panel__chip--active" : ""}`}
                onClick={() => onFilterChange(section.filterKey, opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "text": {
      return (
        <div className="filter-panel__section" key={section.id || section.filterKey}>
          {section.label && (
            <span className="filter-panel__label">{section.label}</span>
          )}
          <input
            type="text"
            className="filter-panel__text-input"
            placeholder={section.placeholder}
            inputMode={section.inputMode || "text"}
            value={filters[section.filterKey] || ""}
            onChange={(e) => {
              const value = section.transform
                ? section.transform(e.target.value)
                : e.target.value;
              onFilterChange(section.filterKey, value);
            }}
          />
        </div>
      );
    }

    case "price-range": {
      const minKey = section.minFilterKey || "priceMin";
      const maxKey = section.maxFilterKey || "priceMax";
      return (
        <div className="filter-panel__section" key={section.id || "price-range"}>
          {section.label && (
            <span className="filter-panel__label">{section.label}</span>
          )}
          <div className="filter-panel__price-range">
            <input
              type="number"
              min="0"
              placeholder="Mín"
              value={filters[minKey] || ""}
              onChange={(e) => onFilterChange(minKey, e.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Máx"
              value={filters[maxKey] || ""}
              onChange={(e) => onFilterChange(maxKey, e.target.value)}
            />
          </div>
        </div>
      );
    }

    case "price-select": {
      const key = section.filterKey || "priceRange";
      return (
        <div className="filter-panel__section" key={section.id || key}>
          {section.label && (
            <span className="filter-panel__label">{section.label}</span>
          )}
          <div className="filter-panel__select-wrapper">
            <select
              value={filters[key] || "all"}
              onChange={(e) => onFilterChange(key, e.target.value)}
            >
              {section.options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="filter-panel__select-arrow" />
          </div>
        </div>
      );
    }

    case "reset": {
      return (
        <button
          key={section.id || "reset"}
          type="button"
          className="filter-panel__reset-btn"
          onClick={() => {}}
        >
          <RotateCcw size={16} />
          <span>{section.label || "Restablecer filtros"}</span>
        </button>
      );
    }

    default:
      return null;
  }
}

export default function FilterPanel({
  sections,
  filters,
  onFilterChange,
  onReset,
  className = "",
}: FilterPanelProps) {
  return (
    <div className={`filter-panel ${className}`}>
      {sections.map((section) => {
        if (section.type === "reset") {
          return (
            <button
              key={section.id || "reset"}
              type="button"
              className="filter-panel__reset-btn"
              onClick={onReset}
            >
              <RotateCcw size={16} />
              <span>{section.label || "Restablecer filtros"}</span>
            </button>
          );
        }
        return renderSection(section, filters, onFilterChange);
      })}
    </div>
  );
}
