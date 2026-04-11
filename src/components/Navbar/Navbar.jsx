import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/paths';
import SearchBar from './SearchBar';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to={ROUTES.home} className="navbar__logo" aria-label="Obsidian Kinetic home">
          <span className="navbar__logo-letter">U</span>
        </Link>

        {/* Search */}
        <div className="navbar__search">
          <SearchBar />
        </div>

        {/* Location + Avatar */}
        <div className="navbar__right">
          <div className="navbar__location">
            <span className="navbar__location-label">Ubicación</span>
            <span className="navbar__location-city">SAN FRANCISCO</span>
          </div>
          <button className="navbar__avatar" aria-label="User menu">
            <span>JV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
