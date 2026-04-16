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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import { supabase } from "../../services/supabaseClient";

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
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const [promosOpen, setPromosOpen] = useState(
    activeItem === "promotions-create" || activeItem === "promotions-all",
  );

  const handleSupport = () => {
    if (typeof window !== "undefined") {
      window.open("mailto:support@obsidianpro.com", "_blank");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Unable to sign out cleanly:", error);
    }

    navigate(ROUTES.login);
  };

  const openProposalCreator =
    onCreateProposal ??
    (() => navigate(ROUTES.dashboard, { state: { view: "create-proposal" } }));

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
      onClick: openProposalCreator,
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
          onClick: onPromotionsCreate,
        },
        {
          key: "promotions-all",
          label: "Ver Todas",
          onClick: onPromotionsViewAll,
        },
      ],
    },
    {
      key: "products",
      label: "PRODUCTS",
      icon: Package,
      onClick: onProductsClick ?? (() => navigate(ROUTES.products)),
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
      onClick: onNotificationsClick,
    },
    {
      key: "subscription",
      label: "SUBSCRIPTION",
      icon: CreditCard,
      onClick: onSubscriptionClick ?? (() => {}),
    },
    {
      key: "settings",
      label: "ACCOUNT SETTINGS",
      icon: Settings,
      onClick: () => navigate(ROUTES.settings),
    },
  ];

  const isPromosActive =
    activeItem === "promotions-create" || activeItem === "promotions-all";

  return (
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
          <span className="brand-logo">Obsidian Pro</span>
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
          ({ key, label, icon: Icon, onClick, expandable, subItems }) =>
            expandable ? (
              <div key={key} className="nav-group">
                <button
                  type="button"
                  className={`nav-item ${isPromosActive ? "active" : ""}`}
                  onClick={() => setPromosOpen((v) => !v)}
                  title={label}
                >
                  <Icon size={20} />
                  <span className="nav-label">{label}</span>
                  <ChevronDown
                    size={14}
                    className={`nav-chevron ${promosOpen ? "nav-chevron--open" : ""}`}
                  />
                </button>
                {promosOpen && (
                  <div className="nav-sub-items">
                    {subItems.map((sub) => (
                      <button
                        key={sub.key}
                        type="button"
                        className={`nav-sub-item ${activeItem === sub.key ? "active" : ""}`}
                        onClick={() => {
                          sub.onClick();
                          setPromosOpen(false);
                        }}
                        title={sub.label}
                      >
                        <span className="nav-sub-dot" />
                        <span className="nav-sub-label">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={key}
                type="button"
                className={`nav-item ${activeItem === key ? "active" : ""}`}
                onClick={() => {
                  setPromosOpen(false);
                  onClick();
                }}
                title={label}
              >
                <Icon size={20} />
                <span className="nav-label">{label}</span>
              </button>
            ),
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-links">
          <button
            type="button"
            className="footer-link footer-link--support"
            onClick={handleSupport}
            title="Support"
          >
            <HelpCircle size={18} />
            <span className="footer-label">SUPPORT</span>
          </button>
          <button
            type="button"
            className="footer-link footer-link--logout"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
            <span className="footer-label">LOGOUT</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
