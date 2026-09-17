"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  MessageSquare,
  Ticket,
  Bell,
  ChevronDown,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  CreditCard,
  CalendarDays,
  Landmark,
  Home,
  UserRound,
  Clapperboard,
  Briefcase,
  ClipboardList,
  Mail,
  MessageCircle,
  Loader2,
  Users,
  Image as ImageIcon,
  AlertTriangle,
  Building2,
  Store,
  Truck,
  Map as MapIcon,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "../../routes/paths";
import { useAuth } from "../../context/AuthContext";
import Modal from "../Modal/Modal";
import { userService } from "../../services/userService";
import { commerceService } from "../../services/commerceService";
import { useAlert } from "@/context/AlertContext";
import logoWordmark from "../../images/Logo solo nombre sin fondo.png";

type DashboardSidebarProps = {
  activeItem?: string;
  isCollapsed?: boolean;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onToggle?: () => void;
  onCloseMobile?: () => void;
  onCreateProposal?: () => void;
  onDashboardClick?: () => void;
  onMessagesClick?: () => void;
  onNotificationsClick?: () => void;
  onPromotionsCreate?: () => void;
  onPromotionsViewAll?: () => void;
  onProductsClick?: () => void;
  onServicesClick?: () => void;
  onSubscriptionClick?: () => void;
  onCalendarClick?: () => void;
  onBankPromosClick?: () => void;
  onProfileClick?: () => void;
  onReelsClick?: () => void;
  onProposalsCreate?: () => void;
  onProposalsView?: () => void;
  onJobRequestsClick?: () => void;
  onReportErrorsClick?: () => void;
};

export default function DashboardSidebar({
  activeItem = "dashboard",
  isCollapsed = false,
  isMobile = false,
  isMobileOpen = false,
  onToggle,
  onCloseMobile,
  onCreateProposal,
  onDashboardClick,
  onMessagesClick,
  onNotificationsClick,
  onPromotionsCreate,
  onPromotionsViewAll,
  onProductsClick,
  onServicesClick,
  onSubscriptionClick,
  onCalendarClick,
  onBankPromosClick,
  onProfileClick,
  onReelsClick,
  onProposalsCreate,
  onProposalsView,
  onJobRequestsClick,
  onReportErrorsClick,
}: DashboardSidebarProps) {
  const router = useRouter();
  const {
    logout,
    hasProfessionalSubscription,
    user,
    sessionStatus,
    subscriptionPlan,
  } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    promotions:
      activeItem === "promotions-create" || activeItem === "promotions-all",
    proposals:
      activeItem === "proposals-create" || activeItem === "proposals-view",
  });
  const { showError } = useAlert();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-me"],
    queryFn: () => commerceService.getUserProfile(),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const isTransport = userProfile?.logistics_role === "transport_company";

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const alwaysEnabledItems = new Set([
    "overview",
    "sales",
    "liquidations",
    "commercial-data",
    "branches",
    "riders",
    "fleet-map",
    "products",
    "services",
    "proposals",
    "proposals-view",
    "job-requests",
    "messages",
    "notifications",
    "subscription",
    "settings",
    "referrals",
    "faq",
    "purchases",
    "favorites",
    "cart",
    "reputation",
  ]);

  const isFreePlan = subscriptionPlan === "free";

  const isItemLocked = (key: string) => {
    if (!hasProfessionalSubscription) {
      return !alwaysEnabledItems.has(key);
    }
    if (isFreePlan) {
      const blockedForFree = new Set([
        "proposals-create",
        "promotions-create",
        "promotions-all",
        "bank-promotions",
        "reels",
        "jobs",
        "publications",
      ]);
      return blockedForFree.has(key);
    }
    return false;
  };

  const getLockedTitle = (label: string, isLocked: boolean) =>
    isLocked ? `${label} · Requiere suscripción profesional activa` : label;

  const handleSupport = () => {
    setIsSupportModalOpen(true);
  };

  const handleEmailSupport = () => {
    if (typeof window !== "undefined") {
      window.open("mailto:support@obsidianpro.com", "_blank");
    }
  };

  const handleWhatsAppSupport = async () => {
    try {
      setIsLoadingWhatsApp(true);
      const response = await userService.getMobilePhone();
      if (response && response.mobilePhone) {
        const cleanNumber = response.mobilePhone.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanNumber}`, "_blank");
      } else {
        showError("El número de WhatsApp no está disponible en este momento.");
      }
    } catch (error) {
      console.error("Error fetching mobile phone:", error);
      showError("Hubo un error al intentar obtener el número de soporte.");
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  const goToDashboardView = (view: string) => {
    router.push(`${ROUTES.dashboard}?view=${view}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Unable to sign out cleanly:", error);
    }

    router.push(ROUTES.login);
  };

  const handleNavigation = (action?: () => void) => {
    action?.();

    if (isMobile) {
      onCloseMobile?.();
    }
  };

  const mobileUserName =
    sessionStatus?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Profesional";

  const mobileUserRole = hasProfessionalSubscription
    ? "Cuenta profesional activa"
    : "Cuenta en configuracion";

  const mobileUserInitial =
    mobileUserName.trim().charAt(0).toUpperCase() || "P";

  const navItems = [
    {
      key: "dashboard",
      label: "PANEL",
      icon: LayoutDashboard,
      onClick: onDashboardClick ?? (() => router.push(ROUTES.dashboard)),
    },
    // Commercial Sections
    {
      key: "sales",
      label: "VENTAS",
      icon: BarChart3,
      onClick: () => goToDashboardView("sales"),
    },
    {
      key: "liquidations",
      label: "LIQUIDACIONES",
      icon: CreditCard,
      onClick: () => goToDashboardView("liquidations"),
    },
    {
      key: "commercial-data",
      label: "DATOS COMERCIALES",
      icon: Building2,
      onClick: () => goToDashboardView("commercial-data"),
    },
    {
      key: "branches",
      label: "SUCURSALES",
      icon: Store,
      onClick: () => goToDashboardView("branches"),
    },
    {
      key: "reputation",
      label: "REPUTACIÓN Y SCORE",
      icon: Award,
      onClick: () => goToDashboardView("reputation"),
    },
    // Transport & Logistics
    ...(isTransport
      ? [
          {
            key: "riders",
            label: "RIDERS Y FLETEROS",
            icon: Truck,
            onClick: () => goToDashboardView("riders"),
          },
          {
            key: "fleet-map",
            label: "MAPA DE ENVÍOS",
            icon: MapIcon,
            onClick: () => goToDashboardView("fleet-map"),
          },
        ]
      : []),
    {
      key: "products",
      label: "PRODUCTOS",
      icon: Package,
      onClick: onProductsClick ?? (() => goToDashboardView("products")),
    },
    {
      key: "services",
      label: "SERVICIOS",
      icon: Briefcase,
      onClick: onServicesClick ?? (() => goToDashboardView("services")),
    },
    // Buyer Sections (Available to all users)
    {
      key: "purchases",
      label: "COMPRAS",
      icon: ShoppingBag,
      onClick: () => goToDashboardView("purchases"),
    },
    {
      key: "favorites",
      label: "FAVORITOS",
      icon: Heart,
      onClick: () => goToDashboardView("favorites"),
    },
    {
      key: "cart",
      label: "CARRITO",
      icon: ShoppingCart,
      onClick: () => goToDashboardView("cart"),
    },
    // Profile & Professional Services
    {
      key: "profile",
      label: "PERFIL",
      icon: UserRound,
      onClick: onProfileClick ?? (() => goToDashboardView("profile")),
    },
    {
      key: "proposals",
      label: "PRESUPUESTOS",
      icon: FileText,
      expandable: true,
      subItems: [
        {
          key: "proposals-create",
          label: "Crear Presupuesto",
          onClick:
            onProposalsCreate ?? (() => goToDashboardView("proposals-create")),
        },
        {
          key: "proposals-view",
          label: "Ver Presupuestos",
          onClick:
            onProposalsView ?? (() => goToDashboardView("proposals-view")),
        },
      ],
    },
    {
      key: "job-requests",
      label: "SOLICITUDES",
      icon: ClipboardList,
      onClick: onJobRequestsClick ?? (() => goToDashboardView("job-requests")),
    },
    {
      key: "promotions",
      label: "PROMOCIONES",
      icon: Ticket,
      expandable: true,
      subItems: [
        {
          key: "promotions-create",
          label: "Crear Promoción",
          onClick:
            onPromotionsCreate ??
            (() => goToDashboardView("promotions-create")),
        },
        {
          key: "promotions-all",
          label: "Ver Todas",
          onClick:
            onPromotionsViewAll ?? (() => goToDashboardView("promotions-all")),
        },
      ],
    },
    {
      key: "bank-promotions",
      label: "PROM. BANCARIAS",
      icon: Landmark,
      onClick:
        onBankPromosClick ?? (() => goToDashboardView("bank-promotions")),
    },
    {
      key: "jobs",
      label: "EMPLEOS",
      icon: Briefcase,
      onClick: () => goToDashboardView("jobs"),
    },
    {
      key: "publications",
      label: "PUBLICACIONES",
      icon: ImageIcon,
      onClick: () => goToDashboardView("publications"),
    },
    {
      key: "calendar",
      label: "CALENDARIO",
      icon: CalendarDays,
      onClick: onCalendarClick ?? (() => goToDashboardView("calendar")),
    },
    {
      key: "reels",
      label: "HISTORIAS",
      icon: Clapperboard,
      onClick: onReelsClick ?? (() => goToDashboardView("reels")),
    },
    {
      key: "referrals",
      label: "REFERIDOS",
      icon: Users,
      onClick: () => goToDashboardView("referrals"),
    },
    {
      key: "messages",
      label: "MENSAJES",
      icon: MessageSquare,
      onClick: onMessagesClick ?? (() => router.push(ROUTES.messages)),
    },
    {
      key: "notifications",
      label: "NOTIFICACIONES",
      icon: Bell,
      onClick:
        onNotificationsClick ?? (() => goToDashboardView("notifications")),
    },
    {
      key: "subscription",
      label: "SUSCRIPCIÓN",
      icon: CreditCard,
      onClick: onSubscriptionClick ?? (() => goToDashboardView("subscription")),
    },
    {
      key: "settings",
      label: "CONFIGURACIÓN",
      icon: Settings,
      onClick: () => router.push(ROUTES.settings),
    },
    {
      key: "faq",
      label: "AYUDA",
      icon: HelpCircle,
      onClick: () => goToDashboardView("faq"),
    },
    {
      key: "report-errors",
      label: "REPORTAR ERROR",
      icon: AlertTriangle,
      onClick:
        onReportErrorsClick ?? (() => goToDashboardView("report-errors")),
    },
  ];

  const renderNavItems = () => {
    return navItems.map((item) => {
      const Icon = item.icon;
      const isLocked = isItemLocked(item.key);
      const isExpanded = expandedMenus[item.key];
      const isActive =
        activeItem === item.key ||
        (item.subItems &&
          item.subItems.some((sub) => activeItem === sub.key));

      if (item.expandable && item.subItems) {
        return (
          <div key={item.key} className="nav-group">
            <button
              type="button"
              className={`nav-item ${isActive ? "active" : ""} ${isLocked ? "nav-item--locked" : ""}`}
              onClick={() => {
                if (isCollapsed && onToggle) {
                  onToggle();
                }
                toggleMenu(item.key);
              }}
              title={getLockedTitle(item.label, isLocked)}
            >
              <Icon size={20} className="nav-icon" />
              {!isCollapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={`expand-icon ${isExpanded ? "expanded" : ""}`}
                  />
                </>
              )}
            </button>
            {!isCollapsed && isExpanded && (
              <div className="sub-menu">
                {item.subItems.map((subItem) => {
                  const isSubLocked = isItemLocked(subItem.key);
                  const isSubActive = activeItem === subItem.key;
                  return (
                    <button
                      key={subItem.key}
                      type="button"
                      className={`sub-nav-item ${isSubActive ? "active" : ""} ${isSubLocked ? "nav-item--locked" : ""}`}
                      onClick={() => handleNavigation(subItem.onClick)}
                      title={getLockedTitle(subItem.label, isSubLocked)}
                    >
                      <span className="sub-nav-dot" />
                      <span className="nav-label">{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      return (
        <button
          key={item.key}
          type="button"
          className={`nav-item ${isActive ? "active" : ""} ${isLocked ? "nav-item--locked" : ""}`}
          onClick={() => handleNavigation(item.onClick)}
          title={getLockedTitle(item.label, isLocked)}
        >
          <Icon size={20} className="nav-icon" />
          {!isCollapsed && <span className="nav-label">{item.label}</span>}
        </button>
      );
    });
  };

  const renderSupportActions = () => {
    return (
      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-item support-btn"
          onClick={handleSupport}
          title="Soporte técnico"
        >
          <HelpCircle size={20} className="nav-icon" />
          {!isCollapsed && <span className="nav-label">SOPORTE</span>}
        </button>
        <button
          type="button"
          className="nav-item logout-btn"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut size={20} className="nav-icon" />
          {!isCollapsed && <span className="nav-label">CERRAR SESIÓN</span>}
        </button>
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        {isMobileOpen ? (
          <div className="dashboard-sidebar-overlay" onClick={onCloseMobile} />
        ) : null}

        <aside
          className={`dashboard-sidebar dashboard-sidebar--mobile-panel ${isMobileOpen ? "dashboard-sidebar--mobile-open" : ""}`}
        >
          <div className="sidebar-brand sidebar-brand--mobile-panel">
            <div className="dashboard-mobile-sheet__identity">
              <button
                type="button"
                className="brand-home-btn"
                onClick={() => router.push(ROUTES.home)}
              >
                <Home size={18} />
                <span>Inicio</span>
              </button>

              <div className="dashboard-mobile-sheet__profile-card">
                <span
                  className="dashboard-mobile-sheet__avatar"
                  aria-hidden="true"
                >
                  {mobileUserInitial}
                </span>
                <div className="dashboard-mobile-sheet__heading">
                  <span className="dashboard-mobile-sheet__eyebrow">
                    Panel rápido
                  </span>
                  <p className="dashboard-mobile-sheet__user-name">
                    {mobileUserName}
                  </p>
                  <p className="dashboard-mobile-sheet__user-role">
                    {mobileUserRole}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {renderNavItems()}
            {renderSupportActions()}
          </nav>
        </aside>
      </>
    );
  }

  return (
    <>
      <aside
        className={`dashboard-sidebar ${isCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logoWordmark.src} alt="Sercio" />
          </div>
          {onToggle && (
            <button
              type="button"
              className="toggle-btn"
              onClick={onToggle}
              title={isCollapsed ? "Expandir" : "Colapsar"}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>

        <div
          style={{
            padding: "0 var(--space-4)",
            marginBottom: "var(--space-2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="brand-home-btn"
            onClick={() => router.push(ROUTES.home)}
            title="Ir a Inicio"
          >
            <Home size={18} />
            {!isCollapsed && <span>Inicio</span>}
          </button>
        </div>

        <nav className="sidebar-nav">
          {renderNavItems()}
          {renderSupportActions()}
        </nav>
      </aside>

      <Modal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        title="Opciones de Soporte"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "8px 0",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleEmailSupport}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Mail size={18} />
            <span>Enviar Email</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleWhatsAppSupport}
            disabled={isLoadingWhatsApp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderColor: "#25D366",
              color: "#25D366",
              background: "rgba(37, 211, 102, 0.05)",
            }}
          >
            {isLoadingWhatsApp ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <MessageCircle size={18} />
            )}
            <span>Mensaje por WhatsApp</span>
          </button>
        </div>
      </Modal>
    </>
  );
}
