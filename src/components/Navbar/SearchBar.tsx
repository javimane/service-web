import { useState } from 'react';
import './SearchBar.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Search logic will be wired up when backend is ready
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        className="search-bar__input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Busca servicios, lugares, profesionales..."
        aria-label="Search"
      />
      <button className="search-bar__btn" type="submit">
        Buscar
      </button>
    </form>
  );
}
