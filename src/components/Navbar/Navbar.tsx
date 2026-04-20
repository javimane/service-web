import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ROUTES } from "../../routes/paths";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import {
  Bell,
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  LogIn,
  MessageSquare,
  FileText,
  Ticket,
  TrendingUp,
  CheckCheck,
  Package,
  BarChart3,
  Crown,
  Menu,
  X,
} from "lucide-react";
import SearchBar from "./SearchBar";
import PlansModal from "../PlansModal/PlansModal";
import BrandLogo from "../BrandLogo/BrandLogo";

import "./Navbar.css";

const notifications = [
  {
    id: 1,
    icon: FileText,
    iconColor: "blue",
    title: "Propuesta aceptada",
    description: 'Tu propuesta "Remodelación Terraza" fue aprobada.',
    time: "Hace 5 min",
    unread: true,
  },
  {
    id: 2,
    icon: MessageSquare,
    iconColor: "green",
    title: "Nuevo mensaje",
    description: "Julian Vargas te envió un mensaje.",
    time: "Hace 30 min",
    unread: true,
  },
  {
    id: 3,
    icon: Ticket,
    iconColor: "orange",
    title: "Promoción por vencer",
    description: '"Descuento 20%" expira en 2 días.',
    time: "Hace 1 hora",
    unread: true,
  },
  {
    id: 4,
    icon: TrendingUp,
    iconColor: "purple",
    title: "Estadísticas semanales",
    description: "Tu perfil creció un +12.4% esta semana.",
    time: "Hace 3 horas",
    unread: false,
  },
  {
    id: 5,
    icon: FileText,
    iconColor: "blue",
    title: "Nueva reseña",
    description: "Elena Rossi dejó una reseña de 5 estrellas.",
    time: "Ayer",
    unread: false,
  },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const navLinks = [
    { label: "Categorías", path: ROUTES.categories },
    { label: "Mapa", path: ROUTES.map },
    { label: "Servicios", path: ROUTES.services },
    { label: "Productos", path: ROUTES.products },
  ];

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsNotifOpen(false);
  };

  const toggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    navigate(ROUTES.home);
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Usuario";

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        {/* Mobile menu + Logo */}
        <div className="navbar__mobile-menu" ref={mobileMenuRef}>
          <button
            className="navbar__hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menú de navegación"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {isMobileMenuOpen && (
            <div className="navbar__mobile-dropdown">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`navbar__mobile-link ${location.pathname === link.path ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          to={ROUTES.home}
          className="navbar__logo"
          aria-label="Ir al inicio"
        >
          <BrandLogo className="navbar__brand-mark" />
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

        {/* Plans button */}
        <button
          className="navbar__plans-btn"
          onClick={() => setIsPlansOpen(true)}
        >
          <Crown size={16} />
          <span>Planes</span>
        </button>
        <PlansModal
          isOpen={isPlansOpen}
          onClose={() => setIsPlansOpen(false)}
        />

        {/* Right side — authenticated */}
        {user ? (
          <div className="navbar__right">
            <Link
              to={ROUTES.messages}
              className="navbar__icon-btn"
              aria-label="Mensajes"
            >
              <MessageSquare size={20} />
            </Link>

            <div className="navbar__notif-container" ref={notifRef}>
              <button
                className={`navbar__icon-btn ${isNotifOpen ? "active" : ""}`}
                aria-label="Notificaciones"
                onClick={toggleNotif}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="navbar__notif-badge">{unreadCount}</span>
                )}
              </button>

              {isNotifOpen && (
                <div className="navbar__notif-dropdown">
                  <div className="notif-dropdown__header">
                    <span className="notif-dropdown__title">
                      Notificaciones
                    </span>
                    <button
                      type="button"
                      className="notif-dropdown__mark-all"
                      aria-label="Marcar todas como leídas"
                    >
                      <CheckCheck size={16} />
                    </button>
                  </div>
                  <div className="notif-dropdown__list">
                    {notifications.map((notif) => {
                      const IconComp = notif.icon;
                      return (
                        <div
                          key={notif.id}
                          className={`notif-item ${notif.unread ? "notif-item--unread" : ""}`}
                        >
                          <div
                            className={`notif-item__icon notif-item__icon--${notif.iconColor}`}
                          >
                            <IconComp size={16} />
                          </div>
                          <div className="notif-item__content">
                            <span className="notif-item__title">
                              {notif.title}
                            </span>
                            <span className="notif-item__desc">
                              {notif.description}
                            </span>
                          </div>
                          <span className="notif-item__time">{notif.time}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="notif-dropdown__footer">
                    <Link
                      to={ROUTES.dashboard}
                      state={{ view: "notifications" }}
                      className="notif-dropdown__view-all"
                      onClick={() => setIsNotifOpen(false)}
                    >
                      Ver todas las notificaciones
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="navbar__user-container" ref={menuRef}>
              <button
                className={`navbar__icon-btn navbar__avatar ${isMenuOpen ? "active" : ""}`}
                onClick={toggleMenu}
                aria-label="Menú de usuario"
              >
                <User size={20} />
              </button>

              {isMenuOpen && (
                <div className="navbar__dropdown">
                  <div className="dropdown__header">
                    <div className="dropdown__user-info">
                      <span className="dropdown__username">{displayName}</span>
                      <span className="dropdown__user-role">{user.email}</span>
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
                    <Link
                      to={ROUTES.products}
                      className="dropdown__item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Package size={18} />
                      <span>Productos</span>
                    </Link>
                    <Link
                      to={ROUTES.analytics}
                      className="dropdown__item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BarChart3 size={18} />
                      <span>Analíticas</span>
                    </Link>
                  </div>
                  <div className="dropdown__divider"></div>
                  <div className="dropdown__footer">
                    <button
                      className="dropdown__item dropdown__item--logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Right side — not authenticated */
          <div className="navbar__right">
            <button
              className="navbar__auth-btn"
              onClick={() => openAuth("login")}
            >
              <LogIn size={18} />
              <span>Iniciar Sesión</span>
            </button>
            <button
              className="navbar__auth-btn navbar__auth-btn--primary"
              onClick={() => openAuth("register")}
            >
              Registrarse
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
