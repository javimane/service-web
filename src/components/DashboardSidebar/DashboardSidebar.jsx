import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import { supabase } from "../../services/supabaseClient";

export default function DashboardSidebar({
  activeItem = "dashboard",
  isCollapsed = false,
  onToggle,
  onCreateProposal,
  onDashboardClick,
}) {
  const navigate = useNavigate();

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
      key: "settings",
      label: "ACCOUNT SETTINGS",
      icon: Settings,
      onClick: () => navigate(ROUTES.settings),
    },
  ];

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
        {navItems.map(({ key, label, icon: Icon, onClick }) => (
          <button
            key={key}
            type="button"
            className={`nav-item ${activeItem === key ? "active" : ""}`}
            onClick={onClick}
            title={label}
          >
            <Icon size={20} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="create-proposal-btn"
          onClick={openProposalCreator}
          title="Create proposal"
        >
          <Plus size={18} />
          <span className="btn-label">Create Proposal</span>
        </button>

        <div className="footer-links">
          <button
            type="button"
            className="footer-link"
            onClick={handleSupport}
            title="Support"
          >
            <HelpCircle size={18} />
            <span className="footer-label">SUPPORT</span>
          </button>
          <button
            type="button"
            className="footer-link"
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
