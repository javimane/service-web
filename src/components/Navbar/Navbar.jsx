import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes/paths';
import { Bell, User } from 'lucide-react';
import SearchBar from './SearchBar';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  
  const navLinks = [
    { label: 'Dashboard', path: ROUTES.home },
    { label: 'Services', path: ROUTES.services },
    { label: 'Map', path: ROUTES.map },
    { label: 'Messages', path: '#' },
  ];

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to={ROUTES.home} className="navbar__logo">
          Obsidiana Pro
        </Link>

        {/* Navigation Links */}
        <nav className="navbar__nav">
          {navLinks.map((link) => (
            <Link 
              key={link.label} 
              to={link.path} 
              className={`navbar__link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="navbar__search">
          <SearchBar />
        </div>

        {/* Right side icons */}
        <div className="navbar__right">
          <button className="navbar__icon-btn" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <Link to={ROUTES.dashboard} className="navbar__icon-btn navbar__avatar" aria-label="Professional Dashboard">
            <User size={20} />
          </Link>
        </div>

      </div>
    </header>
  );
}


