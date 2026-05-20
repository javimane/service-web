"use client";
import { Check, Tag } from "lucide-react";
import "./CategoriesSection.css";

type Category = {
  id: number;
  name: string;
};

type CategoriesSectionProps = {
  selectedCategories: number[];
  onToggleCategory: (id: number) => void;
  categoryList?: Category[];
};

export default function CategoriesSection({
  selectedCategories,
  onToggleCategory,
  categoryList = [],
}: CategoriesSectionProps) {
  const selectedCount = selectedCategories.length;

  const handleClearAll = () => {
    selectedCategories.forEach((id) => onToggleCategory(id));
  };

  return (
    <article className="settings-card categories-section settings-card--wide">
      <div className="section-header settings-header-compact categories-section__header">
        <div className="section-title">
          <span className="section-emoji">🏷️</span>
          <h2>Categorías de Servicios</h2>
        </div>
        {selectedCount > 0 && (
          <div className="categories-section__meta">
            <span className="categories-section__count">
              <Tag size={12} />
              {selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              className="categories-section__clear"
              onClick={handleClearAll}
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      <p className="section-description">
        Seleccioná las categorías en las que te especializás para mejorar tu visibilidad en búsquedas.
      </p>

      <div className="categories-grid">
        {categoryList.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              className={`category-chip ${isSelected ? "category-chip--selected" : ""}`}
              onClick={() => onToggleCategory(cat.id)}
            >
              <div className="chip-check-wrapper">
                <Check size={12} className="chip-check-icon" />
              </div>
              <span className="chip-label">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
