"use client";
import { useEffect, useRef, useState, useMemo } from "react";
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
import { commerceService } from "../../services/commerceService";
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
  HelpCircle,
  MapPin,
  ShoppingCart,
  ShoppingBag,
  Store,
  Building2,
  Truck,
  Map as MapIcon,
  Award,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import SearchBar from "./SearchBar";
import PlansModal from "../PlansModal/PlansModal";
import BrandLogo from "../BrandLogo/BrandLogo";
import { getGuestCart } from "../../utils/guestCart";
import { enableDesktopNotifications } from "../../services/desktopNotifications";
import {
  getNotificationMeta,
  getNotificationTargetUrl,
  getNotificationDescription,
  getReportDownloadUrl,
} from "../../utils/notificationNavigation";

import "./Navbar.css";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    logout,
    hasProfessionalSubscription,
    subscriptionPlan,
    sessionStatus,
  } = useAuth();
  const { openAuth } = useAuthModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [isEnablingDesktop, setIsEnablingDesktop] = useState(false);
  const [desktopNotice, setDesktopNotice] = useState("");
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  const { data: cart } = useQuery({
    queryKey: ["user-cart", user?.id ?? "guest"],
    queryFn: () => (user?.id ? commerceService.cart() : getGuestCart()),
  });
  const cartCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

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
    refetchInterval: 30_000,
  });

  // Traer direcciones del usuario para el botón "Enviar a:"
  const { data: userAddresses = [] } = useQuery({
    queryKey: ["user-addresses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const list = await commerceService.getUserAddresses();
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const defaultAddress = useMemo(() => {
    return (
      userAddresses.find((a: any) => a.is_default) || userAddresses[0] || null
    );
  }, [userAddresses]);

  const deliveryAddressLabel = useMemo(() => {
    if (!defaultAddress) return "Elegir dirección";
    const street = defaultAddress.street || defaultAddress.street_name || "";
    const num = defaultAddress.number || defaultAddress.street_number || "";
    if (!street && !num) return "Elegir dirección";
    return `${street} ${num}`.trim();
  }, [defaultAddress]);

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

  const isProfessional = Boolean(sessionStatus?.is_professional);

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) {
      markAsReadMutation.mutate(notif.id);
    }

    setIsNotifOpen(false);

    if (String(notif.type || "").toUpperCase() === "REPORT_READY") {
      const downloadUrl = getReportDownloadUrl(notif);
      if (downloadUrl) window.open(downloadUrl, "_blank", "noopener,noreferrer");
      else window.alert("El enlace de este reporte no está disponible. Solicitá un nuevo reporte.");
      return;
    }

    const targetUrl = getNotificationTargetUrl(notif, { isProfessional, currentUserId: user?.id });
    router.push(targetUrl);
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
    { label: "Publicaciones", path: ROUTES.publications },
    { label: "Promociones", path: ROUTES.promotions },
    { label: "Empleos", path: ROUTES.jobs },
  ];

  // Traer perfil para roles logísticos / empresa
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-me"],
    queryFn: () => commerceService.getUserProfile(),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const isProfessionalActive = Boolean(
    sessionStatus?.is_professional &&
    (sessionStatus?.professional_active || hasProfessionalSubscription),
  );

  const isCompanyActive = Boolean(
    sessionStatus?.role_id === 3 && isProfessionalActive,
  );

  const isEmployer =
    userProfile?.logistics_role === "transport_company" ||
    userProfile?.logistics_role === "company" ||
    isCompanyActive;

  const dashboardLinks = [
    { label: "Panel", icon: LayoutDashboard, path: ROUTES.dashboard },
    {
      label: "Ventas",
      icon: BarChart3,
      path: `${ROUTES.dashboard}?view=sales`,
    },
    {
      label: "Liquidaciones",
      icon: CreditCard,
      path: `${ROUTES.dashboard}?view=liquidations`,
    },
    {
      label: "Datos Comerciales",
      icon: Building2,
      path: `${ROUTES.dashboard}?view=commercial-data`,
    },
    {
      label: "Sucursales",
      icon: Store,
      path: `${ROUTES.dashboard}?view=branches`,
    },
    {
      label: "Reputación y Score",
      icon: Award,
      path: `${ROUTES.dashboard}?view=reputation`,
    },
    {
      label: "Denuncias",
      icon: ShieldAlert,
      path: `${ROUTES.dashboard}?view=denuncias`,
    },
    ...(isEmployer
      ? [
          {
            label: "Riders y Fleteros",
            icon: Truck,
            path: `${ROUTES.dashboard}?view=riders`,
          },
          {
            label: "Mapa de Envíos",
            icon: MapIcon,
            path: `${ROUTES.dashboard}?view=fleet-map`,
          },
        ]
      : []),
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
      label: "Compras",
      icon: ShoppingBag,
      path: `${ROUTES.dashboard}?view=purchases`,
    },
    {
      label: "Favoritos",
      icon: Heart,
      path: `${ROUTES.dashboard}?view=favorites`,
    },
    {
      label: "Tarjetas",
      icon: CreditCard,
      path: `${ROUTES.dashboard}?view=payment-methods`,
    },
    {
      label: "Carrito",
      icon: ShoppingCart,
      path: `${ROUTES.dashboard}?view=cart`,
    },
    {
      label: "Perfil",
      icon: UserRound,
      path: `${ROUTES.dashboard}?view=profile`,
    },
    {
      label: "Presupuestos",
      icon: FileText,
      path: `${ROUTES.dashboard}?view=proposals-view`,
    },
    {
      label: "Solicitudes",
      icon: ClipboardList,
      path: `${ROUTES.dashboard}?view=job-requests`,
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
      label: "Empleos",
      icon: Briefcase,
      path: `${ROUTES.dashboard}?view=jobs`,
    },
    {
      label: "Publicaciones",
      icon: UploadCloud,
      path: `${ROUTES.dashboard}?view=publications`,
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
    { label: "Mensajes", icon: MessageSquare, path: ROUTES.messages },
    {
      label: "Notificaciones",
      icon: Bell,
      path: `${ROUTES.dashboard}?view=notifications`,
    },
    {
      label: "Suscripción",
      icon: CreditCard,
      path: `${ROUTES.dashboard}?view=subscription`,
    },
    { label: "Configuración", icon: Settings, path: ROUTES.settings },
    {
      label: "Ayuda",
      icon: HelpCircle,
      path: `${ROUTES.dashboard}?view=faq`,
    },
    {
      label: "Reportar Error",
      icon: AlertTriangle,
      path: `${ROUTES.dashboard}?view=report-errors`,
    },
  ];

  const clientLinks = [
    { label: "Panel", icon: LayoutDashboard, path: ROUTES.dashboard },
    {
      label: "Compras",
      icon: ShoppingBag,
      path: `${ROUTES.dashboard}?view=purchases`,
    },
    {
      label: "Favoritos",
      icon: Heart,
      path: `${ROUTES.dashboard}?view=favorites`,
    },
    {
      label: "Tarjetas",
      icon: CreditCard,
      path: `${ROUTES.dashboard}?view=payment-methods`,
    },
    {
      label: "Carrito",
      icon: ShoppingCart,
      path: `${ROUTES.dashboard}?view=cart`,
    },
    { label: "Mensajes", icon: MessageSquare, path: ROUTES.messages },
    {
      label: "Presupuestos",
      icon: FileText,
      path: `${ROUTES.dashboard}?view=proposals-view`,
    },
    {
      label: "Solicitudes",
      icon: ClipboardList,
      path: `${ROUTES.dashboard}?view=job-requests`,
    },
    {
      label: "Notificaciones",
      icon: Bell,
      path: `${ROUTES.dashboard}?view=notifications`,
    },
    {
      label: "Suscripción",
      icon: CreditCard,
      path: `${ROUTES.dashboard}?view=subscription`,
    },
    { label: "Configuración", icon: Settings, path: ROUTES.settings },
    {
      label: "Preguntas Frecuentes",
      icon: HelpCircle,
      path: `${ROUTES.dashboard}?view=faq`,
    },
    {
      label: "Reportar Error",
      icon: AlertTriangle,
      path: `${ROUTES.dashboard}?view=report-errors`,
    },
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
    setDesktopPermission(
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "unsupported",
    );
    setIsNotifOpen(!isNotifOpen);
    setIsMenuOpen(false);
  };

  const handleEnableDesktop = async () => {
    setIsEnablingDesktop(true);
    const status = await enableDesktopNotifications();
    setDesktopPermission(
      "Notification" in window ? Notification.permission : "unsupported",
    );
    setDesktopNotice(
      status === "enabled"
        ? "Avisos de escritorio activados en este navegador."
        : status === "browser-only"
          ? "Permiso concedido. Recibirás avisos mientras la web esté abierta; no se pudo activar el envío en segundo plano."
          : status === "blocked"
            ? "El navegador bloqueó los avisos. Permitilos desde la configuración de este sitio."
            : "Este navegador requiere HTTPS o no admite avisos de escritorio.",
    );
    setIsEnablingDesktop(false);
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

          {/* Enviar a: [calle y número] */}
          <button
            type="button"
            className="navbar__deliver-btn navbar__deliver-btn--desktop"
            onClick={() => router.push(`${ROUTES.settings}#delivery-address`)}
            title="Ver o cambiar dirección de entrega"
          >
            <MapPin size={18} className="navbar__deliver-icon" />
            <div className="navbar__deliver-info">
              <span className="navbar__deliver-sub">Enviar a</span>
              <span
                className="navbar__deliver-title"
                title={deliveryAddressLabel}
              >
                {deliveryAddressLabel}
              </span>
            </div>
          </button>

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
                href={ROUTES.cart}
                className="navbar__icon-btn"
                aria-label={`Carrito, ${cartCount} ${cartCount === 1 ? "artículo" : "artículos"}`}
                title="Ir al carrito"
              >
                <ShoppingCart size={20} aria-hidden="true" />
                <span
                  className="navbar__cart-count"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {cartCount > 0 ? cartCount : null}
                </span>
              </Link>
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
                    {desktopPermission !== "granted" && (
                      <div className="notif-dropdown__desktop">
                        {desktopPermission === "default" ? (
                          <button
                            type="button"
                            className="notif-dropdown__desktop-button"
                            onClick={handleEnableDesktop}
                            disabled={isEnablingDesktop}
                          >
                            <Bell size={16} aria-hidden="true" />
                            {isEnablingDesktop
                              ? "Activando..."
                              : "Activar avisos de escritorio"}
                          </button>
                        ) : (
                          <p className="notif-dropdown__desktop-help">
                            {desktopPermission === "denied"
                              ? "Los avisos están bloqueados. Permitilos desde la configuración de este sitio."
                              : "Los avisos requieren HTTPS y un navegador compatible."}
                          </p>
                        )}
                      </div>
                    )}
                    {desktopNotice && (
                      <p className="notif-dropdown__desktop-help" role="status">
                        {desktopNotice}
                      </p>
                    )}
                    <div className="notif-dropdown__list">
                      {notifications.length === 0 ? (
                        <div className="notif-dropdown__empty">
                          No tienes notificaciones
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif: any) => {
                          const { icon: IconComp, color } = getNotificationMeta(
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
                                  {getNotificationDescription(notif)}
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

                    <div className="dropdown__section-label">
                      {sessionStatus?.is_professional
                        ? "Mi Panel"
                        : "Mi Cuenta"}
                    </div>
                    <div className="dropdown__body dropdown__body--scroll">
                      {(sessionStatus?.is_professional
                        ? dashboardLinks
                        : clientLinks
                      ).map((link) => {
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
          <button
            type="button"
            className="navbar__deliver-btn navbar__deliver-btn--mobile"
            onClick={() => router.push(`${ROUTES.settings}#delivery-address`)}
            title="Ver o cambiar dirección de entrega"
          >
            <MapPin size={15} className="navbar__deliver-icon" />
            <span className="navbar__deliver-sub">Enviar a:</span>
            <span className="navbar__deliver-title">
              {deliveryAddressLabel}
            </span>
          </button>
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
