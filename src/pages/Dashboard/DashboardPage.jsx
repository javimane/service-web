import {
  LayoutDashboard,
  FileText,
  Settings,
  Play,
  Plus,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { engagementData, activities, clips } from "../../data/dashboardData";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import { ROUTES } from "../../routes/paths";
import ProposalCreator from "./sections/ProposalCreator";
import PromotionCreator from "./sections/PromotionCreator";
import AllPromotionsPage from "./sections/AllPromotionsPage";
import NotificationsPage from "./sections/NotificationsPage";
import DashboardProducts from "./sections/DashboardProducts";
import "./DashboardPage.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const [view, setView] = useState("overview");

  useEffect(() => {
    if (location.state?.view === "create-proposal") {
      setView("create-proposal");
      return;
    }
    if (location.state?.view === "notifications") {
      setView("notifications");
      return;
    }

    setView("overview");
  }, [location.state]);

  const handleCreateProposal = () => setView("create-proposal");
  const handleGoBack = () => setView("overview");
  const handleGoProfile = () => navigate(ROUTES.profile);
  const handleGoServices = () => navigate(ROUTES.services);
  const handleGoSettings = () => navigate(ROUTES.settings);
  const handleShowOverview = () => setView("overview");
  const handleShowMessages = () => navigate(ROUTES.messages);
  const handleShowNotifications = () => setView("notifications");
  const handleShowPromotionsCreate = () => setView("promotions-create");
  const handleShowPromotionsAll = () => setView("promotions-all");
  const handleShowProducts = () => setView("products");

  return (
    <div className="dashboard-page-wrapper">
      <div className="dashboard-page">
        <DashboardSidebar
          activeItem={
            view === "create-proposal"
              ? "proposals"
              : view === "notifications"
                ? "notifications"
                : view === "promotions-create"
                  ? "promotions-create"
                  : view === "promotions-all"
                    ? "promotions-all"
                    : view === "products"
                      ? "products"
                      : "dashboard"
          }
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((current) => !current)}
          onCreateProposal={handleCreateProposal}
          onDashboardClick={handleShowOverview}
          onMessagesClick={handleShowMessages}
          onNotificationsClick={handleShowNotifications}
          onPromotionsCreate={handleShowPromotionsCreate}
          onPromotionsViewAll={handleShowPromotionsAll}
          onProductsClick={handleShowProducts}
        />

        <main className="dashboard-main">
          {view === "create-proposal" ? (
            <ProposalCreator onBack={handleGoBack} />
          ) : view === "products" ? (
            <DashboardProducts />
          ) : view === "notifications" ? (
            <NotificationsPage />
          ) : view === "promotions-create" ? (
            <PromotionCreator
              onBack={handleGoBack}
              onViewAll={handleShowPromotionsAll}
            />
          ) : view === "promotions-all" ? (
            <AllPromotionsPage onCreateNew={handleShowPromotionsCreate} />
          ) : (
            <div className="dashboard-content">
              <div className="welcome-section">
                <div className="welcome-copy">
                  <h1>Welcome back, Architect.</h1>
                  <p>
                    Your Obsidian Pro performance is trending{" "}
                    <span className="trending-up">+12.4%</span> this week.
                  </p>
                </div>

                <div className="welcome-actions">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleGoServices}
                  >
                    <FileText size={18} />
                    <span>Explore Services</span>
                    <ChevronRight size={18} />
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleGoSettings}
                  >
                    <Settings size={18} />
                    <span>Account Settings</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card chart-card">
                  <div className="card-header">
                    <div className="label-group">
                      <span className="card-label">IMPACT ANALYSIS</span>
                      <h3>Profile Engagement</h3>
                    </div>
                    <div className="trend-badge">
                      <TrendingUp size={14} />
                      <span>24% INCREASE</span>
                    </div>
                  </div>

                  <div className="bar-chart">
                    {engagementData.map((d, i) => (
                      <div key={i} className="bar-container">
                        <div
                          className={`bar ${i === engagementData.length - 1 ? "highlight" : ""}`}
                          style={{ height: `${d.value}%` }}
                        >
                          {i === engagementData.length - 1 && (
                            <div className="stars">✨</div>
                          )}
                        </div>
                        <span className="bar-day">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stat-card summary-card">
                  <div className="card-header">
                    <LayoutDashboard size={24} className="icon-purple" />
                  </div>
                  <div className="stat-value-group">
                    <span className="card-label">TOTAL PROPOSALS</span>
                    <h2 className="big-value">142</h2>
                  </div>
                  <div className="trend-footer">
                    <span className="trend-plus">+8</span>
                    <span>new this month</span>
                  </div>
                </div>

                <div className="stat-card compact-card">
                  <div className="card-header">
                    <div className="play-icon-bg">
                      <Play size={20} fill="currentColor" />
                    </div>
                  </div>
                  <div className="stat-value-group">
                    <span className="card-label">VIDEO CONTENT REACH</span>
                    <h2 className="mid-value">12.8K</h2>
                  </div>
                  <div className="card-footer">
                    <span className="live-badge">Live</span>
                    <span>performance tracking</span>
                  </div>
                </div>

                <div className="stat-card conversion-card">
                  <div className="stat-value-group">
                    <span className="card-label">CONVERSION METRIC</span>
                    <h2 className="mid-value">89% Accepted</h2>
                    <p>
                      Your proposal acceptance rate is in the top 3% of all
                      Obsidian kinetic architects.
                    </p>
                  </div>
                  <div className="circular-progress-container">
                    <div
                      className="circular-progress"
                      style={{ "--progress": "89%" }}
                    >
                      <div className="progress-inner">89%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lower-grid">
                <div className="section-container">
                  <div className="section-header">
                    <h2>Video Performance</h2>
                    <button
                      type="button"
                      className="view-all"
                      onClick={handleGoServices}
                    >
                      VIEW ALL CLIPS
                    </button>
                  </div>

                  <div className="videos-grid">
                    {clips.map((clip) => (
                      <div key={clip.id} className="video-card">
                        <div className="video-thumb">
                          <img src={clip.thumbnail} alt={clip.title} />
                          <div className="thumb-overlay">
                            <Play size={32} fill="white" />
                          </div>
                          <span className="duration">{clip.duration}</span>
                        </div>
                        <div className="video-info">
                          <h4>{clip.title}</h4>
                          <div className="video-meta">
                            <span>👁 {clip.views}</span>
                            <span>👍 {clip.likes}</span>
                            <span
                              className={`status-tag ${clip.status.toLowerCase()}`}
                            >
                              {clip.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="side-column">
                  <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="actions-list">
                      <button
                        type="button"
                        className="action-btn-main"
                        onClick={handleCreateProposal}
                      >
                        <div className="action-icon">
                          <Plus size={20} />
                        </div>
                        <span>Create New Proposal</span>
                        <ChevronRight size={18} />
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={handleGoProfile}
                      >
                        <FileText size={18} />
                        <span>Edit Profile</span>
                        <ChevronRight size={18} />
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={handleGoSettings}
                      >
                        <Settings size={18} />
                        <span>Account Settings</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="latest-activity">
                    <h3>Latest Activity</h3>
                    <div className="activity-list">
                      {activities.map((activity) => (
                        <div key={activity.id} className="activity-item">
                          <div
                            className={`activity-icon-box ${activity.status.toLowerCase()}`}
                          >
                            {activity.status === "ACCEPTED" && (
                              <TrendingUp size={16} />
                            )}
                            {activity.status === "SENT" && (
                              <FileText size={16} />
                            )}
                            {activity.status === "DRAFT" && (
                              <FileText size={16} />
                            )}
                          </div>
                          <div className="activity-details">
                            <h4>{activity.title}</h4>
                            <p>
                              {activity.time} • {activity.project}
                            </p>
                          </div>
                          <span
                            className={`status-pill ${activity.status.toLowerCase()}`}
                          >
                            {activity.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
