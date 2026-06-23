"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoImage from "../../../images/Logo solo nombre sin fondo.png";
import { useState, useRef, useEffect } from "react";
import {
  Bell,
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  MessageSquare,
  FileText,
  Ticket,
  TrendingUp,
  CheckCheck,
  Package,
  BarChart3,
  ArrowLeft,
  Star,
  UserPlus,
  UserRound,
  ClipboardList,
  Briefcase,
  CalendarDays,
  Clapperboard,
  Users,
  CreditCard,
  Landmark,
} from "lucide-react";
import "./NavbarMessaje.css";
import { useAuth } from "../../../context/AuthContext";
import { ROUTES } from "../../../routes/paths";
import { notificationStorage } from "../../../services/notificationStorage";

const CATEGORY_ICONS = {
  proposals: FileText,
  messages: MessageSquare,
  promotions: Ticket,
  analytics: TrendingUp,
  reviews: Star,
  followers: UserPlus,
  all: Bell,
};

export default function NavbarMessage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardLinks = [
    { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.dashboard },
    {
      label: "Perfil",
      icon: UserRound,
      path: `${ROUTES.dashboard}?view=profile`,
    },
    {
      label: "Solicitudes",
      icon: ClipboardList,
      path: `${ROUTES.dashboard}?view=job-requests`,
    },
    { label: "Mensajes", icon: MessageSquare, path: ROUTES.messages },
    {
      label: "Presupuestos",
      icon: FileText,
      path: `${ROUTES.dashboard}?view=proposals-view`,
    },
    {
      label: "Promociones",
      icon: Ticket,
      path: `${ROUTES.dashboard}?view=promotions-all`,
    },
    {
      label: "Promos Bancarias",
      icon: Landmark,
      path: `${ROUTES.dashboard}?view=bank-promotions`,
    },
    {
      label: "Productos",
      icon: Package,
      path: `${ROUTES.dashboard}?view=products`,
    },
    {
      label: "Servicios",
      icon: Briefcase,
      path: `${ROUTES.dashboard}?view=services`,
    },
    {
      label: "Agenda",
      icon: CalendarDays,
      path: `${ROUTES.dashboard}?view=calendar`,
    },
    {
      label: "Historias",
      icon: Clapperboard,
      path: `${ROUTES.dashboard}?view=reels`,
    },
    {
      label: "Referidos",
      icon: Users,
      path: `${ROUTES.dashboard}?view=referrals`,
    },
    {
      label: "Suscripción",
      icon: CreditCard,
      path: `${ROUTES.dashboard}?view=subscription`,
    },
    { label: "Configuración", icon: Settings, path: ROUTES.settings },
  ];
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  useEffect(() => {
    return notificationStorage.subscribe((notifs) => {
      setNotificationsList(notifs);
    });
  }, []);

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
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
    await logout();
    setIsMenuOpen(false);
    router.push(ROUTES.home);
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Usuario";

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        {/* Back to home */}
        <Link href={ROUTES.home} className="navbar__logo">
          <Image
            src={logoImage}
            alt="Logo"
            width={100}
            height={40}
            style={{ objectFit: "contain" }}
          />
        </Link>

        {/* Right side */}
        <div className="navbar__right">
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
                  <span className="notif-dropdown__title">Notificaciones</span>
                  <button
                    type="button"
                    className="notif-dropdown__mark-all"
                    aria-label="Marcar todas como leídas"
                    onClick={() => notificationStorage.markAllAsRead()}
                  >
                    <CheckCheck size={16} />
                  </button>
                </div>
                <div className="notif-dropdown__list">
                  {notificationsList.slice(0, 5).map((notif) => {
                    const IconComp =
                      CATEGORY_ICONS[
                        notif.category as keyof typeof CATEGORY_ICONS
                      ] || Bell;
                    return (
                      <div
                        key={notif.id}
                        className={`notif-item ${notif.unread ? "notif-item--unread" : ""}`}
                        onClick={() => notificationStorage.markAsRead(notif.id)}
                      >
                        <div
                          className={`notif-item__icon notif-item__icon--${notif.iconColor || "blue"}`}
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
                    href={ROUTES.dashboard}
                    className="notif-dropdown__view-all"
                    onClick={() => setIsNotifOpen(false)}
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="navbar__user-container" ref={menuRef}>
              <button
                className={`navbar__icon-btn navbar__avatar ${isMenuOpen ? "active" : ""}`}
                onClick={toggleMenu}
                aria-label="Menú de usuario"
              >
                <User size={20} />
              </button>

              {isMenuOpen && (
                <div className="navbar__dropdown navbar__dropdown--wide">
                  <div className="dropdown__header">
                    <div className="dropdown__user-info">
                      <span className="dropdown__username">{displayName}</span>
                      <span className="dropdown__user-role">{user.email}</span>
                    </div>
                  </div>
                  <div className="dropdown__divider"></div>

                  <div className="dropdown__section-label">Mi Panel</div>
                  <div className="dropdown__body dropdown__body--scroll">
                    {dashboardLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.label}
                          href={link.path}
                          className="dropdown__item"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Icon size={16} />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="dropdown__divider"></div>
                  <div className="dropdown__footer">
                    <button
                      className="dropdown__item dropdown__item--logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
