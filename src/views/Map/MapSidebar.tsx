"use client";
import { useState } from 'react';
import { Search, Loader2, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '../../services/categoriesApi';
import { locationService } from '../../services/locationService';
import './MapSidebar.css';

export default function MapSidebar({ onFilterChange, specialistsCount, isLoading }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const { data: categories = [], isLoading: isLoadingCats } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => categoriesService.listCategoryServices()
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => locationService.getProvinces()
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', selectedProvince],
    queryFn: () => locationService.getDepartments(selectedProvince),
    enabled: !!selectedProvince
  });

  const handleApply = () => {
    onFilterChange({ 
      search, 
      categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
      provinceId: selectedProvince || undefined,
      departmentId: selectedDepartment || undefined
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleApply();
  };

  return (
    <aside className="map-sidebar">
      <div className="map-sidebar__header">
        <h2 className="map-sidebar__title">Explorar Profesionales</h2>
        <p className="map-sidebar__subtitle">Encuentra expertos cerca de ti</p>
      </div>

      <div className="map-sidebar__section">
        <label className="map-sidebar__label">BÚSQUEDA RÁPIDA</label>
        <div className="search-input">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Nombre o especialidad..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>

      <div className="map-sidebar__section">
        <label className="map-sidebar__label">CATEGORÍAS</label>
        <div className="category-pills">
          <button 
            type="button"
            className={`pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Todas
          </button>
          {isLoadingCats ? (
            <div className="pills-loading">
              <Loader2 className="animate-spin" size={14} />
            </div>
          ) : categories.map((cat) => (
            <button 
              key={cat.id} 
              type="button"
              className={`pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="map-sidebar__section">
        <label className="map-sidebar__label">UBICACIÓN</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select 
            className="map-select"
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedDepartment('');
            }}
          >
            <option value="">Todas las provincias</option>
            {provinces.map((prov: any) => (
              <option key={prov.id} value={prov.id}>{prov.name}</option>
            ))}
          </select>

          <select 
            className="map-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={!selectedProvince}
          >
            <option value="">Todos los departamentos</option>
            {departments.map((dept: any) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="map-sidebar__footer">
        <div className="stats">
          <span>Encontrados:</span>
          <span className="count">{isLoading ? "..." : specialistsCount}</span>
        </div>
        <button 
          className="apply-btn" 
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
