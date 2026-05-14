"use client";
import { useState, useMemo } from "react";
import { Check, MapPin, Globe, ChevronRight } from "lucide-react";
import "./HeadquartersSection.css";

type Province = {
  id: number;
  name: string;
};

type Department = {
  id: number;
  name: string;
  province_id: number;
};

type HeadquartersSectionProps = {
  selectedProvinces: string[];
  onToggleProvince: (name: string) => void;
  selectedDepartments: string[];
  onToggleDepartment: (name: string) => void;
  provinceList?: Province[];
  departmentList?: Department[];
};

export default function HeadquartersSection({
  selectedProvinces,
  onToggleProvince,
  selectedDepartments,
  onToggleDepartment,
  provinceList = [],
  departmentList = [],
}: HeadquartersSectionProps) {
  const [activeProvinceId, setActiveProvinceId] = useState<number | null>(null);

  const activeProvince = useMemo(
    () =>
      provinceList.find((p) => p.id === activeProvinceId) || provinceList[0],
    [provinceList, activeProvinceId],
  );

  const filteredDepartments = useMemo(() => {
    if (!activeProvince) return [];
    return departmentList.filter((d) => d.province_id === activeProvince.id);
  }, [departmentList, activeProvince]);

  const handleSelectAllProvinces = () => {
    const allNames = provinceList.map((p) => p.name);
    const someMissing = allNames.some(
      (name) => !selectedProvinces.includes(name),
    );

    if (someMissing) {
      allNames.forEach((name) => {
        if (!selectedProvinces.includes(name)) onToggleProvince(name);
      });
    } else {
      allNames.forEach((name) => onToggleProvince(name));
    }
  };

  const handleSelectAllDepartments = () => {
    if (!filteredDepartments.length) return;
    const allNames = filteredDepartments.map((d) => d.name);
    const someMissing = allNames.some(
      (name) => !selectedDepartments.includes(name),
    );

    if (someMissing) {
      allNames.forEach((name) => {
        if (!selectedDepartments.includes(name)) onToggleDepartment(name);
      });
    } else {
      allNames.forEach((name) => onToggleDepartment(name));
    }
  };

  return (
    <article className="settings-card headquarters-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">📍</span>
          <h2>Cobertura Geográfica</h2>
        </div>
      </div>

      <div className="geo-selector">
        {/* Provinces Column */}
        <div className="geo-column geo-column--provinces">
          <div className="geo-column__header">
            <h3>Provincias</h3>
            <button
              type="button"
              className="geo-select-all"
              onClick={handleSelectAllProvinces}
            >
              {provinceList.length === selectedProvinces.length
                ? "Deseleccionar todas"
                : "Seleccionar todas"}
            </button>
          </div>
          <div className="geo-list">
            {provinceList.map((p) => (
              <div
                key={p.id}
                className={`geo-item ${activeProvince?.id === p.id ? "geo-item--active" : ""}`}
                onClick={() => setActiveProvinceId(p.id)}
              >
                <label
                  className="geo-checkbox"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedProvinces.includes(p.name)}
                    onChange={() => onToggleProvince(p.name)}
                  />
                  <div className="checkbox-box">
                    <Check size={12} />
                  </div>
                </label>
                <span className="geo-item__name">{p.name}</span>
                <ChevronRight size={14} className="geo-item__arrow" />
              </div>
            ))}
          </div>
        </div>

        {/* Departments Column */}
        <div className="geo-column geo-column--departments">
          <div className="geo-column__header">
            <h3>Departamentos</h3>
            {activeProvince && (
              <button
                type="button"
                className="geo-select-all"
                onClick={handleSelectAllDepartments}
              >
                {filteredDepartments.length > 0 &&
                filteredDepartments.every((d) =>
                  selectedDepartments.includes(d.name),
                )
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
            )}
          </div>
          <div className="geo-list">
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map((d) => (
                <div
                  key={d.id}
                  className={`geo-item ${selectedDepartments.includes(d.name) ? "geo-item--selected" : ""}`}
                  onClick={() => onToggleDepartment(d.name)}
                >
                  <label
                    className="geo-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(d.name)}
                      onChange={() => onToggleDepartment(d.name)}
                    />
                    <div className="checkbox-box">
                      <Check size={12} />
                    </div>
                  </label>
                  <span className="geo-item__name">{d.name}</span>
                </div>
              ))
            ) : (
              <div className="geo-empty">
                <MapPin size={24} />
                <p>Seleccioná una provincia para ver sus departamentos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
