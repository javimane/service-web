import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ROUTES } from "../../routes/paths";
import {
  Bell,
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import SearchBar from "./SearchBar";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navLinks = [
    { label: "Dashboard", path: ROUTES.home },
    { label: "Services", path: ROUTES.services },
    { label: "Map", path: ROUTES.map },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
              className={`navbar__link ${location.pathname === link.path ? "active" : ""}`}
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
          <Link
            to={ROUTES.messages}
            className="navbar__icon-btn"
            aria-label="Messages"
          >
            <MessageSquare size={20} />
          </Link>
          <button className="navbar__icon-btn" aria-label="Notifications">
            <Bell size={20} />
          </button>

          <div className="navbar__user-container" ref={menuRef}>
            <button
              className={`navbar__icon-btn navbar__avatar ${isMenuOpen ? "active" : ""}`}
              onClick={toggleMenu}
              aria-label="User Menu"
            >
              <User size={20} />
            </button>

            {isMenuOpen && (
              <div className="navbar__dropdown">
                <div className="dropdown__header">
                  <div className="dropdown__user-info">
                    <span className="dropdown__username">
                      Architect Julian Vance
                    </span>
                    <span className="dropdown__user-role">Premium Member</span>
                  </div>
                </div>
                <div className="dropdown__divider"></div>
                <div className="dropdown__body">
                  <Link
                    to={ROUTES.profile}
                    className="dropdown__item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings size={18} />
                    <span>Mi Cuenta</span>
                  </Link>
                  <Link
                    to={ROUTES.dashboard}
                    className="dropdown__item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                </div>
                <div className="dropdown__divider"></div>
                <div className="dropdown__footer">
                  <button className="dropdown__item dropdown__item--logout">
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
