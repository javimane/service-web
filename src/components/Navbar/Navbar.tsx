"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  getNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "../../app/actions/notifications";
import { supabase } from "../../services/supabaseClient";
import { ROUTES } from "../../routes/paths";
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
  UploadCloud,
  Heart,
  CalendarDays,
  Clapperboard,
  ClipboardList,
  UserRound,
  Briefcase,
  Landmark,
  Users,
  CreditCard,
} from "lucide-react";
import SearchBar from "./SearchBar";
import PlansModal from "../PlansModal/PlansModal";
import BrandLogo from "../BrandLogo/BrandLogo";

import "./Navbar.css";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return { icon: Heart, color: "red" };
    case "comment":
      return { icon: MessageSquare, color: "blue" };
    case "propossal":
      return { icon: Briefcase, color: "purple" };
    case "message":
      return { icon: MessageSquare, color: "green" };
    default:
      return { icon: Bell, color: "gray" };
  }
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasProfessionalSubscription, subscriptionPlan } =
    useAuth();
  const { openAuth } = useAuthModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  // Traer las notificaciones reales
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await getNotificationsAction({});
      if (res?.data) {
        if (Array.isArray(res.data)) return res.data;
        if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
      }
      return [];
    },
    enabled: !!user?.id,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await markAllNotificationsAsReadAction({});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await markNotificationAsReadAction({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) {
      markAsReadMutation.mutate(notif.id);
    }

    setIsNotifOpen(false);

    switch (notif.type) {
      case "proposal":
      case "propossal":
        router.push(`${ROUTES.dashboard}?view=proposals-view`);
        break;
      case "message":
        router.push(ROUTES.messages);
        break;
      case "promotion":
        router.push(`${ROUTES.dashboard}?view=promotions-all`);
        break;
      default:
        router.push(`${ROUTES.dashboard}?view=notifications`);
        break;
    }
  };

  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error fetching unread messages count:", error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("navbar_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.receiver_id === user.id && !newMsg.is_read) {
            queryClient.invalidateQueries({
              queryKey: ["unread-messages-count", user.id],
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.receiver_id === user.id || newMsg.sender_id === user.id) {
            queryClient.invalidateQueries({
              queryKey: ["unread-messages-count", user.id],
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const navLinks = [
    { label: "Profesionales/Comercios", path: ROUTES.categories },
    { label: "Mapa", path: ROUTES.map },
    { label: "Historias", path: ROUTES.reels },
    { label: "Servicios", path: ROUTES.services },
    { label: "Productos", path: ROUTES.products },
    { label: "Promociones", path: ROUTES.promotions },
  ];

  const dashboardLinks = [
    { label: "Panel", icon: LayoutDashboard, path: ROUTES.dashboard },
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-open plans modal after professional registration
  useEffect(() => {
    if (!user) {
      setIsPlansOpen(false);
      return;
    }

    if (
      typeof window !== "undefined" &&
      localStorage.getItem("show_plans_on_login") === "true"
    ) {
      localStorage.removeItem("show_plans_on_login");
      // Only open if they don't already have a subscription
      if (!subscriptionPlan) {
        setIsPlansOpen(true);
      }
    }
  }, [user, subscriptionPlan]);

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
      {/* ── TOP ROW: logo + search + actions ── */}
      <div className="navbar__top">
        <div className="navbar__inner container">
          {/* Mobile hamburger */}
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
                <div className="navbar__mobile-section-label">Explorar</div>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.path}
                    className={`navbar__mobile-link ${pathname === link.path ? "active" : ""}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Logo */}
          <Link
            href={ROUTES.home}
            className="navbar__logo"
            aria-label="Ir al inicio"
          >
            <BrandLogo className="navbar__brand-mark" />
          </Link>

          {/* Search (Desktop/Tablet) */}
          <div className="navbar__search navbar__search--desktop">
            <SearchBar />
          </div>

          {/* Plans button */}
          {!hasProfessionalSubscription && (
            <button
              className="navbar__plans-btn"
              onClick={() => setIsPlansOpen(true)}
            >
              <Crown size={16} />
              <span>Planes</span>
            </button>
          )}

          <PlansModal
            isOpen={isPlansOpen}
            onClose={() => setIsPlansOpen(false)}
          />

          {/* Right side — authenticated */}
          {user ? (
            <div className="navbar__right">
              <Link
                href={ROUTES.messages}
                className="navbar__icon-btn"
                aria-label="Mensajes"
              >
                <MessageSquare size={20} />
                {unreadMessagesCount > 0 && (
                  <span className="navbar__notif-badge">
                    {unreadMessagesCount}
                  </span>
                )}
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
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={
                          markAllAsReadMutation.isPending || unreadCount === 0
                        }
                      >
                        <CheckCheck size={16} />
                      </button>
                    </div>
                    <div className="notif-dropdown__list">
                      {notifications.length === 0 ? (
                        <div className="notif-dropdown__empty">
                          No tienes notificaciones
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif: any) => {
                          const { icon: IconComp, color } = getNotificationIcon(
                            notif.type,
                          );

                          let timeStr = "";
                          try {
                            timeStr = formatDistanceToNow(
                              new Date(notif.created_at),
                              { addSuffix: true, locale: es },
                            );
                          } catch (e) {
                            timeStr = "Recientemente";
                          }

                          return (
                            <div
                              key={notif.id}
                              className={`notif-item ${!notif.is_read ? "notif-item--unread" : ""}`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div
                                className={`notif-item__icon notif-item__icon--${color}`}
                              >
                                <IconComp size={16} />
                              </div>
                              <div className="notif-item__content">
                                <span className="notif-item__title">
                                  {notif.title}
                                </span>
                                <span className="notif-item__desc">
                                  {notif.content}
                                </span>
                              </div>
                              <span className="notif-item__time">
                                {timeStr}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="notif-dropdown__footer">
                      <Link
                        href={`${ROUTES.dashboard}?view=notifications`}
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
                  <div className="navbar__dropdown navbar__dropdown--wide">
                    <div className="dropdown__header">
                      <div className="dropdown__user-info">
                        <span className="dropdown__username">
                          {displayName}
                        </span>
                        <span className="dropdown__user-role">
                          {user.email}
                        </span>
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
            </div>
          ) : (
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

        {/* Mobile-only search bar row */}
        <div className="navbar__search-mobile">
          <SearchBar />
        </div>
      </div>

      {/* ── BOTTOM ROW: nav links (desktop only) ── */}
      <nav className="navbar__bottom">
        <div className="navbar__bottom-inner container">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.path}
              className={`navbar__link ${pathname === link.path ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
