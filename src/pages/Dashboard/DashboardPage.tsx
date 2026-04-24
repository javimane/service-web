import {
  LayoutDashboard,
  FileText,
  Settings,
  Play,
  Plus,
  ChevronRight,
  TrendingUp,
  Clapperboard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { useAuth } from "../../context/AuthContext";
import { engagementData, activities, clips } from "../../data/dashboardData";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import { ROUTES } from "../../routes/paths";
import ProposalCreator from "./sections/ProposalCreator";
import PromotionCreator from "./sections/PromotionCreator";
import AllPromotionsPage from "./sections/AllPromotionsPage";
import NotificationsPage from "./sections/NotificationsPage";
import DashboardProducts from "./sections/DashboardProducts";
import SubscriptionSection from "./sections/SubscriptionSection";
import CalendarSection from "./sections/CalendarSection";
import BankPromotionsPage from "./sections/BankPromotionsPage";
import ProfessionalProfileSection from "./sections/ProfessionalProfileSection";
import ReelsSection from "./sections/ReelsSection";
import "./DashboardPage.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasProfessionalSubscription } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const [view, setView] = useState("overview");

  const openViewsForInactiveSubscription = new Set([
    "subscription",
    "notifications",
    "create-proposal",
  ]);
  const shouldLockDashboardView =
    !hasProfessionalSubscription && !openViewsForInactiveSubscription.has(view);

  useEffect(() => {
    if (location.state?.view) {
      setView(location.state.view);
    } else {
      setView("overview");
    }
  }, [location.state]);

  const handleCreateProposal = () => setView("create-proposal");
  const handleGoBack = () => setView("overview");
  const handleGoProfile = () => setView("profile");
  const handleGoServices = () => navigate(ROUTES.services);
  const handleGoSettings = () => navigate(ROUTES.settings);
  const handleShowOverview = () => setView("overview");
  const handleShowMessages = () => navigate(ROUTES.messages);
  const handleShowNotifications = () => setView("notifications");
  const handleShowPromotionsCreate = () => setView("promotions-create");
  const handleShowPromotionsAll = () => setView("promotions-all");
  const handleShowProducts = () => setView("products");
  const handleShowSubscription = () => setView("subscription");
  const handleShowCalendar = () => setView("calendar");
  const handleShowBankPromos = () => setView("bank-promotions");
  const handleShowProfile = () => setView("profile");
  const handleShowReels = () => setView("reels");

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
                      : view === "subscription"
                        ? "subscription"
                        : view === "calendar"
                          ? "calendar"
                          : view === "bank-promotions"
                            ? "bank-promotions"
                            : view === "reels"
                              ? "reels"
                              : view === "profile"
                                ? "profile"
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
          onSubscriptionClick={handleShowSubscription}
          onCalendarClick={handleShowCalendar}
          onBankPromosClick={handleShowBankPromos}
          onProfileClick={handleShowProfile}
          onReelsClick={handleShowReels}
        />

        <main className="dashboard-main">
          <div
            className={`dashboard-main-panel ${shouldLockDashboardView ? "dashboard-main-panel--locked" : ""}`}
          >
            {view === "create-proposal" ? (
              <ProposalCreator onBack={handleGoBack} />
            ) : view === "calendar" ? (
              <CalendarSection />
            ) : view === "subscription" ? (
              <SubscriptionSection />
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
            ) : view === "bank-promotions" ? (
              <BankPromotionsPage />
            ) : view === "reels" ? (
              <ReelsSection />
            ) : view === "profile" ? (
              <ProfessionalProfileSection />
            ) : (
              <div className="dashboard-content">
                <div className="welcome-section">
                  <div className="welcome-copy">
                    <h1>Welcome back, Architect.</h1>
                    <p>
                      Your Sercio performance is trending{" "}
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
                        Tu tasa de aceptación está entre los perfiles con mejor
                        rendimiento de Sercio.
                      </p>
                    </div>
                    <div className="circular-progress-container">
                      <div
                        className="circular-progress"
                        style={{ "--progress": "89%" } as any}
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
                          onClick={handleShowReels}
                        >
                          <Clapperboard size={18} />
                          <span>Gestionar Reels</span>
                          <ChevronRight size={18} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={handleGoProfile}
                        >
                          <FileText size={18} />
                          <span>Editar Perfil</span>
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

            {shouldLockDashboardView && (
              <div className="subscription-lock-overlay" role="alert">
                <div className="subscription-lock-card">
                  <h3>Suscripción profesional requerida</h3>
                  <p>
                    Para acceder a esta sección necesitás una suscripción
                    profesional activa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
