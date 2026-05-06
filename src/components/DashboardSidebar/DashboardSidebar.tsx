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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../BrandLogo/BrandLogo";

type DashboardSidebarProps = {
  activeItem?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onCreateProposal?: () => void;
  onDashboardClick?: () => void;
  onMessagesClick?: () => void;
  onNotificationsClick?: () => void;
  onPromotionsCreate?: () => void;
  onPromotionsViewAll?: () => void;
  onProductsClick?: () => void;
  onSubscriptionClick?: () => void;
  onCalendarClick?: () => void;
  onBankPromosClick?: () => void;
  onProfileClick?: () => void;
  onReelsClick?: () => void;
  onProposalsCreate?: () => void;
  onProposalsView?: () => void;
};

export default function DashboardSidebar({
  activeItem = "dashboard",
  isCollapsed = false,
  onToggle,
  onCreateProposal,
  onDashboardClick,
  onMessagesClick,
  onNotificationsClick,
  onPromotionsCreate,
  onPromotionsViewAll,
  onProductsClick,
  onSubscriptionClick,
  onCalendarClick,
  onBankPromosClick,
  onProfileClick,
  onReelsClick,
  onProposalsCreate,
  onProposalsView,
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const { logout, hasProfessionalSubscription } = useAuth();
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
    "messages",
    "notifications",
    "subscription",
    "settings",
  ]);

  const isItemLocked = (key: string) =>
    !hasProfessionalSubscription && !alwaysEnabledItems.has(key);

  const getLockedTitle = (label: string, isLocked: boolean) =>
    isLocked ? `${label} · Requiere suscripción profesional activa` : label;

  const handleSupport = () => {
    if (typeof window !== "undefined") {
      window.open("mailto:support@obsidianpro.com", "_blank");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Unable to sign out cleanly:", error);
    }

    navigate(ROUTES.login);
  };

  const navItems = [
    {
      key: "dashboard",
      label: "DASHBOARD",
      icon: LayoutDashboard,
      onClick: onDashboardClick ?? (() => navigate(ROUTES.dashboard)),
    },
    {
      key: "analytics",
      label: "ANALYTICS",
      icon: BarChart3,
      onClick: () => navigate(ROUTES.analytics),
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
            onProposalsCreate ??
            (() =>
              navigate(ROUTES.dashboard, {
                state: { view: "proposals-create" },
              })),
        },
        {
          key: "proposals-view",
          label: "Ver Presupuestos",
          onClick:
            onProposalsView ??
            (() =>
              navigate(ROUTES.dashboard, {
                state: { view: "proposals-view" },
              })),
        },
      ],
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
            (() =>
              navigate(ROUTES.dashboard, {
                state: { view: "promotions-create" },
              })),
        },
        {
          key: "promotions-all",
          label: "Ver Todas",
          onClick:
            onPromotionsViewAll ??
            (() =>
              navigate(ROUTES.dashboard, {
                state: { view: "promotions-all" },
              })),
        },
      ],
    },
    {
      key: "bank-promotions",
      label: "BANK PROMOTIONS",
      icon: Landmark,
      onClick:
        onBankPromosClick ??
        (() =>
          navigate(ROUTES.dashboard, { state: { view: "bank-promotions" } })),
    },
    {
      key: "products",
      label: "PRODUCTS",
      icon: Package,
      onClick:
        onProductsClick ??
        (() => navigate(ROUTES.dashboard, { state: { view: "products" } })),
    },
    {
      key: "calendar",
      label: "CALENDAR",
      icon: CalendarDays,
      onClick:
        onCalendarClick ??
        (() => navigate(ROUTES.dashboard, { state: { view: "calendar" } })),
    },
    {
      key: "profile",
      label: "PERFIL",
      icon: UserRound,
      onClick:
        onProfileClick ??
        (() => navigate(ROUTES.dashboard, { state: { view: "profile" } })),
    },
    {
      key: "reels",
      label: "REELS",
      icon: Clapperboard,
      onClick:
        onReelsClick ??
        (() => navigate(ROUTES.dashboard, { state: { view: "reels" } })),
    },
    {
      key: "messages",
      label: "MESSAGES",
      icon: MessageSquare,
      onClick: onMessagesClick ?? (() => navigate(ROUTES.messages)),
    },
    {
      key: "notifications",
      label: "NOTIFICATIONS",
      icon: Bell,
      onClick:
        onNotificationsClick ??
        (() =>
          navigate(ROUTES.dashboard, { state: { view: "notifications" } })),
    },
    {
      key: "subscription",
      label: "SUBSCRIPTION",
      icon: CreditCard,
      onClick:
        onSubscriptionClick ??
        (() => navigate(ROUTES.dashboard, { state: { view: "subscription" } })),
    },
    {
      key: "settings",
      label: "ACCOUNT SETTINGS",
      icon: Settings,
      onClick: () => navigate(ROUTES.settings),
    },
  ];

  return (
    <>
      {!isCollapsed && onToggle && (
        <div className="dashboard-sidebar-overlay" onClick={onToggle} />
      )}
      <aside
        className={`dashboard-sidebar ${isCollapsed ? "dashboard-sidebar--collapsed" : ""}`}
      >
      <div className="sidebar-brand">
        <button
          type="button"
          className="brand-logo-btn"
          onClick={() => navigate(ROUTES.home)}
          aria-label="Go to home"
        >
          <BrandLogo className="brand-logo" compact={isCollapsed} />
        </button>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(
          ({ key, label, icon: Icon, onClick, expandable, subItems }) => {
            const isParentLocked = isItemLocked(key);

            return expandable ? (
              <div key={key} className="nav-group">
                <button
                  type="button"
                  className={`nav-item ${expandedMenus[key] || subItems?.some((s) => s.key === activeItem) ? "active" : ""} ${isParentLocked ? "is-locked" : ""}`}
                  onClick={() => {
                    if (isParentLocked) return;
                    if (isCollapsed && onToggle) {
                      onToggle();
                      if (!expandedMenus[key]) {
                        toggleMenu(key);
                      }
                    } else {
                      toggleMenu(key);
                    }
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
                {!isCollapsed && expandedMenus[key] && subItems && (
                  <div className="nav-sub-items">
                    {subItems.map((sub) =>
                      (() => {
                        const isSubItemLocked = isItemLocked(sub.key);

                        return (
                          <button
                            key={sub.key}
                            type="button"
                            className={`nav-sub-item ${activeItem === sub.key ? "active" : ""} ${isSubItemLocked ? "is-locked" : ""}`}
                            onClick={() => {
                              if (isSubItemLocked) return;
                              sub.onClick();
                              toggleMenu(key);
                            }}
                            title={getLockedTitle(sub.label, isSubItemLocked)}
                            disabled={isSubItemLocked}
                          >
                            <span className="nav-sub-dot" />
                            <span className="nav-sub-label">{sub.label}</span>
                          </button>
                        );
                      })(),
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={key}
                type="button"
                className={`nav-item ${activeItem === key ? "active" : ""} ${isItemLocked(key) ? "is-locked" : ""}`}
                onClick={() => {
                  if (isItemLocked(key)) return;
                  // Optional: collapse all when clicking a direct item
                  onClick();
                }}
                title={getLockedTitle(label, isItemLocked(key))}
                disabled={isItemLocked(key)}
              >
                <Icon size={20} />
                <span className="nav-label">{label}</span>
              </button>
            );
          },
        )}
        <button
          type="button"
          className="nav-item footer-link footer-link--support"
          onClick={handleSupport}
          title="Support"
        >
          <HelpCircle size={20} />
          <span className="nav-label">SUPPORT</span>
        </button>
        <button
          type="button"
          className="nav-item footer-link footer-link--logout"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={20} />
          <span className="nav-label">LOGOUT</span>
        </button>
      </nav>
    </aside>
    </>
  );
}
