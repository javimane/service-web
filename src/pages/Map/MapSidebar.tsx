import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { categories } from '../../data/categories';
import { professionals } from '../../data/specialists';
import './MapSidebar.css';

export default function MapSidebar({ onFilterChange, specialistsCount }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Architecture');

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearch(term);
    filterResults(term, selectedCategory);
  };

  const handleCategoryClick = (catName) => {
    setSelectedCategory(catName);
    filterResults(search, catName);
  };

  const filterResults = (searchTerm, category) => {
    const filtered = professionals.filter(prof => {
      const matchesSearch = prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prof.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'All' || prof.category === category || (category === 'Architecture' && prof.category === 'Design');
      return matchesSearch && matchesCategory;
    });
    onFilterChange(filtered);
  };

  return (
    <aside className="map-sidebar">
      <div className="map-sidebar__header">
        <h2>Refine Specialists</h2>
        <p>Architectural Precision Search</p>
      </div>

      <div className="map-sidebar__section">
        <label className="map-sidebar__label">QUICK SEARCH</label>
        <div className="search-input">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Specialist name..." 
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="map-sidebar__section">
        <label className="map-sidebar__label">CATEGORIES</label>
        <div className="category-pills">
          {['Architecture', 'Engineering', 'Interior Design', 'Urban Planning', 'Landscaping'].map((cat) => (
            <button 
              key={cat} 
              className={`pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="map-sidebar__section">
        <label className="map-sidebar__label">LOCATION</label>
        <div className="map-dropdown">
          <span>New York State</span>
          <ChevronDown size={16} />
        </div>
        <div className="map-dropdown">
          <span>New York City</span>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="map-sidebar__footer">
        <div className="stats">
          <span>Specialists found:</span>
          <span className="count">{specialistsCount}</span>
        </div>
        <button className="apply-btn">APPLY FILTER</button>
      </div>
    </aside>
  );
}
