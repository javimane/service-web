"use client";
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
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { useAuth } from "../../context/AuthContext";
import { activities, clips } from "../../data/dashboardData";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import { ROUTES } from "../../routes/paths";
import { getProfessionalMeAction } from "../../app/actions/professionals";
import { getProposalsCountAction } from "../../app/actions/proposals";
import { getProfessionalReelStatsAction } from "../../app/actions/reels";
import { getVideosByProfessionalAction } from "../../app/actions/multimedia";
import type { CountViewsReelsRow } from "../../types/database.types";
import { getAccessToken } from "../../utils/auth";
import ProposalCreator from "./sections/ProposalCreator";
import ProposalsView from "./sections/ProposalsView";
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
import DashboardServices from "./sections/DashboardServices";
import DashboardReferrals from "./sections/DashboardReferrals";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasProfessionalSubscription, sessionStatus } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [view, setView] = useState("overview");
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSidebarMode, setIsMobileSidebarMode] = useState(false);
  const routeView = searchParams.get("view");

  const { data: myProfessional } = useQuery({
    queryKey: ["professional-me"],
    queryFn: async () => {
      const token = getAccessToken();
      const result = await getProfessionalMeAction(
        token ? { token } : undefined,
      );
      return result?.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: proposalsCountData } = useQuery({
    queryKey: ["proposals-count", professionalId],
    queryFn: async () => {
      const result = await getProposalsCountAction({ professionalId });
      return result?.data ?? { count: 0 };
    },
    enabled: !!professionalId,
  });

  const { data: reelsStats } = useQuery({
    queryKey: ["reels-stats", professionalId],
    queryFn: async () => {
      const result = await getProfessionalReelStatsAction({ professionalId });
      return result?.data ?? null;
    },
    enabled: !!professionalId,
  });

  const { data: professionalVideos = [] } = useQuery({
    queryKey: ["professional-videos", professionalId],
    queryFn: async () => {
      const result = await getVideosByProfessionalAction({ professionalId });
      return result?.data ?? [];
    },
    enabled: !!professionalId,
  });

  const profileViews = myProfessional?.profile_views ?? 0;

  const acceptedProposalsCount = proposalsCountData?.count ?? 0;

  const handleShowProposalsCreate = () => setView("proposals-create");
  const handleShowProposalsView = () => setView("proposals-view");
  const handleGoBack = () => setView("overview");
  const handleGoProfile = () => setView("profile");
  const handleGoServices = () => router.push(ROUTES.services);
  const handleGoSettings = () => router.push(ROUTES.settings);
  const handleShowOverview = () => setView("overview");
  const handleShowMessages = () => router.push(ROUTES.messages);
  const handleShowNotifications = () => setView("notifications");
  const handleShowPromotionsCreate = (promo?: any) => {
    setEditingPromotion(promo || null);
    setView("promotions-create");
  };
  const handleShowPromotionsAll = () => setView("promotions-all");
  const handleShowProducts = () => setView("products");
  const handleShowServices = () => setView("services");
  const handleShowSubscription = () => setView("subscription");
  const handleShowCalendar = () => setView("calendar");
  const handleShowBankPromos = () => setView("bank-promotions");
  const handleShowProfile = () => setView("profile");
  const handleShowReels = () => setView("reels");

  const openViewsForInactiveSubscription = new Set([
    "subscription",
    "notifications",
    "proposals-view",
    "referrals",
  ]);
  const shouldLockDashboardView =
    !hasProfessionalSubscription && !openViewsForInactiveSubscription.has(view);

  useEffect(() => {
    setView(routeView || "overview");
  }, [routeView]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 600px)");

    const syncMobileSidebarMode = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches;
      setIsMobileSidebarMode(matches);
      setIsMobileSidebarOpen(false);
    };

    syncMobileSidebarMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMobileSidebarMode);
      return () =>
        mediaQuery.removeEventListener("change", syncMobileSidebarMode);
    }

    mediaQuery.addListener(syncMobileSidebarMode);
    return () => mediaQuery.removeListener(syncMobileSidebarMode);
  }, []);

  useEffect(() => {
    if (isMobileSidebarMode) {
      setIsMobileSidebarOpen(false);
    }
  }, [view, isMobileSidebarMode]);

  const handleSidebarToggle = () => {
    if (isMobileSidebarMode) {
      setIsMobileSidebarOpen((current) => !current);
      return;
    }

    setIsSidebarCollapsed((current) => !current);
  };

  const totalProfileViews = profileViews ?? 0;
  const chartHeight = Math.max(
    10,
    Math.min(100, Math.round((totalProfileViews / 1000) * 100)),
  );

  return (
    <div className="dashboard-page-wrapper">
      <div className="dashboard-page">
        <DashboardSidebar
          activeItem={
            view === "proposals-create"
              ? "proposals-create"
              : view === "proposals-view"
                ? "proposals-view"
                : view === "notifications"
                  ? "notifications"
                  : view === "promotions-create"
                    ? "promotions-create"
                    : view === "promotions-all"
                      ? "promotions-all"
                      : view === "products"
                        ? "products"
                        : view === "reels"
                          ? "reels"
                          : view === "profile"
                            ? "profile"
                            : "dashboard"
          }
          isCollapsed={isMobileSidebarMode ? false : isSidebarCollapsed}
          isMobile={isMobileSidebarMode}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onToggle={handleSidebarToggle}
          onProposalsCreate={handleShowProposalsCreate}
          onProposalsView={handleShowProposalsView}
          onDashboardClick={handleShowOverview}
          onMessagesClick={handleShowMessages}
          onNotificationsClick={handleShowNotifications}
          onPromotionsCreate={handleShowPromotionsCreate}
          onPromotionsViewAll={handleShowPromotionsAll}
          onProductsClick={handleShowProducts}
          onServicesClick={handleShowServices}
          onSubscriptionClick={handleShowSubscription}
          onCalendarClick={handleShowCalendar}
          onBankPromosClick={handleShowBankPromos}
          onProfileClick={handleShowProfile}
          onReelsClick={handleShowReels}
        />

        <main
          className={`dashboard-main ${isSidebarCollapsed ? "dashboard-main--collapsed" : ""} ${isMobileSidebarMode ? "dashboard-main--mobile" : ""}`}
        >
          <div
            className={`dashboard-main-panel ${shouldLockDashboardView ? "dashboard-main-panel--locked" : ""}`}
          >
            {view === "proposals-create" ? (
              <ProposalCreator onBack={handleGoBack} />
            ) : view === "proposals-view" ? (
              <ProposalsView />
            ) : view === "calendar" ? (
              <CalendarSection />
            ) : view === "subscription" ? (
              <SubscriptionSection />
            ) : view === "products" ? (
              <DashboardProducts />
            ) : view === "services" ? (
              <DashboardServices />
            ) : view === "notifications" ? (
              <NotificationsPage />
            ) : view === "promotions-create" ? (
              <PromotionCreator
                onBack={handleGoBack}
                onViewAll={handleShowPromotionsAll}
                promotionToEdit={editingPromotion}
              />
            ) : view === "promotions-all" ? (
              <AllPromotionsPage
                onCreateNew={() => handleShowPromotionsCreate()}
                onEdit={handleShowPromotionsCreate}
              />
            ) : view === "bank-promotions" ? (
              <BankPromotionsPage />
            ) : view === "reels" ? (
              <ReelsSection />
            ) : view === "profile" ? (
              <ProfessionalProfileSection />
            ) : view === "referrals" ? (
              <DashboardReferrals />
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
                        <span>
                          {/* {profileViews !== null
                            ? `${profileViews.toLocaleString("es-AR")} VISTAS`
                            : "SIN DATOS"} */}
                        </span>
                      </div>
                    </div>

                    <div className="bar-chart">
                      <div className="bar-container">
                        <div
                          className="bar highlight"
                          style={{ height: `${chartHeight}%` }}
                        >
                          <div className="stars">👁</div>
                        </div>
                        <span className="bar-day">Vistas</span>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card compact-card">
                    <div className="card-header">
                      <LayoutDashboard size={24} className="icon-purple" />
                    </div>
                    <div className="stat-value-group">
                      <span className="card-label">
                        TOTAL PRESUPUESTOS ACEPTADOS
                      </span>
                      <h2 className="big-value">
                        {acceptedProposalsCount !== null
                          ? acceptedProposalsCount.toLocaleString("es-AR")
                          : "--"}
                      </h2>
                    </div>
                  </div>

                  <div className="stat-card compact-card">
                    <div className="card-header">
                      <div className="play-icon-bg">
                        <Play size={20} fill="currentColor" />
                      </div>
                      <h3 className="mid-value">Reels</h3>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "32px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div className="stat-value-group">
                        <span className="card-label">CANTIDAD DE VISTAS</span>
                        <h2 className="mid-value">
                          {reelsStats?.total_views !== undefined
                            ? reelsStats.total_views >= 1000
                              ? `${(reelsStats.total_views / 1000).toFixed(1)}K`
                              : reelsStats.total_views
                            : "--"}
                        </h2>
                      </div>
                      <div className="stat-value-group">
                        <span className="card-label">CANTIDAD DE LIKES</span>
                        <h2 className="mid-value">
                          {reelsStats?.total_likes !== undefined
                            ? reelsStats.total_likes >= 1000
                              ? `${(reelsStats.total_likes / 1000).toFixed(1)}K`
                              : reelsStats.total_likes
                            : "--"}
                        </h2>
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
                      {professionalVideos.length > 0 ? (
                        professionalVideos.slice(0, 4).map((video) => (
                          <div key={video.id} className="video-card">
                            <div className="video-thumb">
                              {video.thumbnail_url ? (
                                <img
                                  src={video.thumbnail_url}
                                  alt={video.title || "Video"}
                                />
                              ) : (
                                <div className="video-thumb-placeholder">
                                  <Play size={32} />
                                </div>
                              )}
                              <div className="thumb-overlay">
                                <Play size={32} fill="white" />
                              </div>
                              <span className="duration">
                                {video.duration_seconds
                                  ? `${Math.floor(video.duration_seconds / 60)}:${String(
                                      video.duration_seconds % 60,
                                    ).padStart(2, "0")}`
                                  : "0:00"}
                              </span>
                            </div>
                            <div className="video-info">
                              <h4>{video.title || "Sin título"}</h4>
                              <div className="video-meta">
                                <span>👁 {video.views_count || 0}</span>
                                <span>👍 {video.likes || 0}</span>
                                <span
                                  className={`status-tag ${
                                    video.activate ? "active" : "inactive"
                                  }`}
                                >
                                  {video.activate ? "Activo" : "Inactivo"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-videos-placeholder">
                          <p>No hay videos subidos aún.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="side-column">
                    <div className="quick-actions">
                      <h3>Quick Actions</h3>
                      <div className="actions-list">
                        <button
                          type="button"
                          className="action-btn-main"
                          onClick={handleShowProposalsCreate}
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
