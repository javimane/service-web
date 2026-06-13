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
  UserRound,
  Clapperboard,
  Briefcase,
  Users,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../routes/paths";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../BrandLogo/BrandLogo";

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
}: DashboardSidebarProps) {
  const router = useRouter();
  const { logout, hasProfessionalSubscription, user, sessionStatus, subscriptionPlan } =
    useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    promotions:
      activeItem === "promotions-create" || activeItem === "promotions-all",
    proposals:
      activeItem === "proposals-create" || activeItem === "proposals-view",
  });

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const alwaysEnabledItems = new Set([
    "proposals",
    "proposals-view",
    "job-requests",
    "messages",
    "notifications",
    "subscription",
    "settings",
    "referrals",
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
        "calendar",
        "reels",
      ]);
      return blockedForFree.has(key);
    }
    return false;
  };

  const getLockedTitle = (label: string, isLocked: boolean) =>
    isLocked ? `${label} · Requiere suscripción profesional activa` : label;

  const handleSupport = () => {
    if (typeof window !== "undefined") {
      window.open("mailto:support@obsidianpro.com", "_blank");
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
      label: "DASHBOARD",
      icon: LayoutDashboard,
      onClick: onDashboardClick ?? (() => router.push(ROUTES.dashboard)),
    },
    {
      key: "proposals",
      label: "PROPOSALS",
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
      label: "PROMOTIONS",
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
      label: "BANK PROMOTIONS",
      icon: Landmark,
      onClick:
        onBankPromosClick ?? (() => goToDashboardView("bank-promotions")),
    },
    {
      key: "products",
      label: "PRODUCTS",
      icon: Package,
      onClick: onProductsClick ?? (() => goToDashboardView("products")),
    },
    {
      key: "services",
      label: "SERVICIOS",
      icon: Briefcase,
      onClick: onServicesClick ?? (() => goToDashboardView("services")),
    },
    {
      key: "calendar",
      label: "CALENDAR",
      icon: CalendarDays,
      onClick: onCalendarClick ?? (() => goToDashboardView("calendar")),
    },
    {
      key: "profile",
      label: "PERFIL",
      icon: UserRound,
      onClick: onProfileClick ?? (() => goToDashboardView("profile")),
    },
    {
      key: "reels",
      label: "REELS",
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
      label: "MESSAGES",
      icon: MessageSquare,
      onClick: onMessagesClick ?? (() => router.push(ROUTES.messages)),
    },
    {
      key: "notifications",
      label: "NOTIFICATIONS",
      icon: Bell,
      onClick:
        onNotificationsClick ?? (() => goToDashboardView("notifications")),
    },
    {
      key: "subscription",
      label: "SUBSCRIPTION",
      icon: CreditCard,
      onClick: onSubscriptionClick ?? (() => goToDashboardView("subscription")),
    },
    {
      key: "settings",
      label: "ACCOUNT SETTINGS",
      icon: Settings,
      onClick: () => router.push(ROUTES.settings),
    },
  ];

  const renderSupportActions = () => (
    <>
      <button
        type="button"
        className="nav-item footer-link footer-link--support"
        onClick={() => handleNavigation(handleSupport)}
        title="Support"
      >
        <HelpCircle size={20} />
        <span className="nav-label">SUPPORT</span>
      </button>
      <button
        type="button"
        className="nav-item footer-link footer-link--logout"
        onClick={() => handleNavigation(handleLogout)}
        title="Logout"
      >
        <LogOut size={20} />
        <span className="nav-label">LOGOUT</span>
      </button>
    </>
  );

  const renderNavItems = () =>
    navItems.map(
      ({ key, label, icon: Icon, onClick, expandable, subItems }) => {
        const isParentLocked = isItemLocked(key);
        const isExpanded =
          expandedMenus[key] || subItems?.some((sub) => sub.key === activeItem);

        if (expandable) {
          return (
            <div key={key} className="nav-group">
              <button
                type="button"
                className={`nav-item ${isExpanded ? "active" : ""} ${isParentLocked ? "is-locked" : ""}`}
                onClick={() => {
                  if (isParentLocked) return;

                  if (!isMobile && isCollapsed && onToggle) {
                    onToggle();
                    if (!expandedMenus[key]) {
                      toggleMenu(key);
                    }
                    return;
                  }

                  toggleMenu(key);
                }}
                title={getLockedTitle(label, isParentLocked)}
                disabled={isParentLocked}
              >
                <Icon size={20} />
                <span className="nav-label">{label}</span>
                <ChevronDown
                  size={14}
                  className={`nav-chevron ${expandedMenus[key] ? "nav-chevron--open" : ""}`}
                />
              </button>

              {(isMobile || !isCollapsed) && expandedMenus[key] && subItems ? (
                <div className="nav-sub-items">
                  {subItems.map((sub) => {
                    const isSubItemLocked = isItemLocked(sub.key);

                    return (
                      <button
                        key={sub.key}
                        type="button"
                        className={`nav-sub-item ${activeItem === sub.key ? "active" : ""} ${isSubItemLocked ? "is-locked" : ""}`}
                        onClick={() => {
                          if (isSubItemLocked) return;
                          handleNavigation(sub.onClick);
                          toggleMenu(key);
                        }}
                        title={getLockedTitle(sub.label, isSubItemLocked)}
                        disabled={isSubItemLocked}
                      >
                        <span className="nav-sub-dot" />
                        <span className="nav-sub-label">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <button
            key={key}
            type="button"
            className={`nav-item ${activeItem === key ? "active" : ""} ${isItemLocked(key) ? "is-locked" : ""}`}
            onClick={() => {
              if (isItemLocked(key)) return;
              handleNavigation(onClick);
            }}
            title={getLockedTitle(label, isItemLocked(key))}
            disabled={isItemLocked(key)}
          >
            <Icon size={20} />
            <span className="nav-label">{label}</span>
          </button>
        );
      },
    );

  const mobileQuickActions = [
    {
      key: "profile",
      label: "Perfil",
      description: "Tu vidriera",
      icon: UserRound,
      onClick: onProfileClick ?? (() => goToDashboardView("profile")),
      isActive: activeItem === "profile",
      isLocked: isItemLocked("profile"),
    },
    {
      key: "calendar",
      label: "Agenda",
      description: "Horarios y turnos",
      icon: CalendarDays,
      onClick: onCalendarClick ?? (() => goToDashboardView("calendar")),
      isActive: activeItem === "calendar",
      isLocked: isItemLocked("calendar"),
    },
    {
      key: "products",
      label: "Productos",
      description: "Catalogo rapido",
      icon: Package,
      onClick: onProductsClick ?? (() => goToDashboardView("products")),
      isActive: activeItem === "products",
      isLocked: isItemLocked("products"),
    },
    {
      key: "services",
      label: "Servicios",
      description: "Tus servicios",
      icon: Briefcase,
      onClick: onServicesClick ?? (() => goToDashboardView("services")),
      isActive: activeItem === "services",
      isLocked: isItemLocked("services"),
    },
    {
      key: "reels",
      label: "Reels",
      description: "Contenido corto",
      icon: Clapperboard,
      onClick: onReelsClick ?? (() => goToDashboardView("reels")),
      isActive: activeItem === "reels",
      isLocked: isItemLocked("reels"),
    },
  ];

  const mobileManageActions = [
    {
      key: "proposals-create",
      label: "Crear presupuesto",
      icon: FileText,
      onClick:
        onProposalsCreate ?? (() => goToDashboardView("proposals-create")),
      isActive: activeItem === "proposals-create",
      isLocked: isItemLocked("proposals-create"),
    },
    {
      key: "job-requests",
      label: "Solicitudes de trabajo",
      icon: ClipboardList,
      onClick: onJobRequestsClick ?? (() => goToDashboardView("job-requests")),
      isActive: activeItem === "job-requests",
      isLocked: false,
    },
    {
      key: "promotions-create",
      label: "Nueva promocion",
      icon: Ticket,
      onClick:
        onPromotionsCreate ?? (() => goToDashboardView("promotions-create")),
      isActive: activeItem === "promotions-create",
      isLocked: isItemLocked("promotions"),
    },
    {
      key: "bank-promotions",
      label: "Promos bancarias",
      icon: Landmark,
      onClick:
        onBankPromosClick ?? (() => goToDashboardView("bank-promotions")),
      isActive: activeItem === "bank-promotions",
      isLocked: isItemLocked("bank-promotions"),
    },
    {
      key: "subscription",
      label: "Suscripcion",
      icon: CreditCard,
      onClick: onSubscriptionClick ?? (() => goToDashboardView("subscription")),
      isActive: activeItem === "subscription",
      isLocked: false,
    },
  ];

  const mobileUtilityActions = [
    {
      key: "home",
      label: "Inicio",
      icon: LayoutDashboard,
      onClick: () => router.push(ROUTES.home),
      isActive: false,
      isLocked: false,
    },
    {
      key: "notifications",
      label: "Notificaciones",
      icon: Bell,
      onClick:
        onNotificationsClick ?? (() => goToDashboardView("notifications")),
      isActive: activeItem === "notifications",
      isLocked: false,
    },
    {
      key: "settings",
      label: "Configuracion",
      icon: Settings,
      onClick: () => router.push(ROUTES.settings),
      isActive: activeItem === "settings",
      isLocked: false,
    },
  ];

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
                className="brand-logo-btn"
                onClick={() => router.push(ROUTES.home)}
                aria-label="Go to home"
              >
                <BrandLogo className="brand-logo" />
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
                    Panel rapido
                  </span>
                  <strong>{mobileUserName}</strong>
                  <small>{mobileUserRole}</small>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-toggle"
              onClick={onCloseMobile}
              aria-label="Cerrar menu"
              title="Cerrar menu"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className="dashboard-mobile-sheet__body sidebar-nav sidebar-nav--mobile-panel">
            <section className="dashboard-mobile-sheet__section">
              <div className="dashboard-mobile-sheet__section-header">
                <h3>Accesos rapidos</h3>
                <span>Lo que mas usas</span>
              </div>

              <div className="dashboard-mobile-shortcuts-grid">
                {mobileQuickActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`dashboard-mobile-shortcut ${item.isActive ? "is-active" : ""} ${item.isLocked ? "is-locked" : ""}`}
                      onClick={() => {
                        if (item.isLocked) return;
                        handleNavigation(item.onClick);
                      }}
                      disabled={item.isLocked}
                      title={getLockedTitle(item.label, item.isLocked)}
                    >
                      <span className="dashboard-mobile-shortcut__icon">
                        <Icon size={20} />
                      </span>
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-mobile-sheet__section">
              <div className="dashboard-mobile-sheet__section-header">
                <h3>Gestion</h3>
                <span>Publica y organiza</span>
              </div>

              <div className="dashboard-mobile-list">
                {mobileManageActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`dashboard-mobile-list__item ${item.isActive ? "is-active" : ""} ${item.isLocked ? "is-locked" : ""}`}
                      onClick={() => {
                        if (item.isLocked) return;
                        handleNavigation(item.onClick);
                      }}
                      disabled={item.isLocked}
                      title={getLockedTitle(item.label, item.isLocked)}
                    >
                      <span className="dashboard-mobile-list__icon">
                        <Icon size={18} />
                      </span>
                      <span className="dashboard-mobile-list__label">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-mobile-sheet__section">
              <div className="dashboard-mobile-sheet__section-header">
                <h3>Cuenta</h3>
                <span>Configuracion y soporte</span>
              </div>

              <div className="dashboard-mobile-list">
                {mobileUtilityActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`dashboard-mobile-list__item ${item.isActive ? "is-active" : ""} ${item.isLocked ? "is-locked" : ""}`}
                      onClick={() => {
                        if (item.isLocked) return;
                        handleNavigation(item.onClick);
                      }}
                      disabled={item.isLocked}
                      title={getLockedTitle(item.label, item.isLocked)}
                    >
                      <span className="dashboard-mobile-list__icon">
                        <Icon size={18} />
                      </span>
                      <span className="dashboard-mobile-list__label">
                        {item.label}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="dashboard-mobile-list__item dashboard-mobile-list__item--support"
                  onClick={() => handleNavigation(handleSupport)}
                >
                  <span className="dashboard-mobile-list__icon">
                    <HelpCircle size={18} />
                  </span>
                  <span className="dashboard-mobile-list__label">Soporte</span>
                </button>

                <button
                  type="button"
                  className="dashboard-mobile-list__item dashboard-mobile-list__item--logout"
                  onClick={() => handleNavigation(handleLogout)}
                >
                  <span className="dashboard-mobile-list__icon">
                    <LogOut size={18} />
                  </span>
                  <span className="dashboard-mobile-list__label">
                    Cerrar sesion
                  </span>
                </button>
              </div>
            </section>
          </div>
        </aside>


      </>
    );
  }

  return (
    <aside
      className={`dashboard-sidebar ${isCollapsed ? "dashboard-sidebar--collapsed" : ""}`}
      onMouseEnter={() => isCollapsed && onToggle?.()}
      onMouseLeave={() => !isCollapsed && onToggle?.()}
    >
      <div className="sidebar-brand">
        <button
          type="button"
          className="brand-logo-btn"
          onClick={() => router.push(ROUTES.home)}
          aria-label="Go to home"
        >
          <BrandLogo className="brand-logo" compact={isCollapsed} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {renderNavItems()}
        {renderSupportActions()}
      </nav>
    </aside>
  );
}
