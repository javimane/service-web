"use client";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Play,
  Plus,
  ChevronRight,
  Clapperboard,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import Modal from "../../components/Modal/Modal";
import RegisterPlanSelection from "../Register/RegisterPlanSelection";
import { useAuth } from "../../context/AuthContext";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import { ROUTES } from "../../routes/paths";
import { getProfessionalMeAction } from "../../app/actions/professionals";
import { getProposalsCountAction } from "../../app/actions/proposals";
import { getProfessionalReelStatsAction } from "../../app/actions/reels";
import { getVideosByProfessionalAction } from "../../app/actions/multimedia";
import { getVideoStatsByProfessionalAction } from "../../app/actions/multimedia";
import { getAccessToken } from "../../utils/auth";
import ProposalCreator from "./sections/ProposalCreator";
import ProposalsView from "./sections/ProposalsView";
import PromotionCreator from "./sections/PromotionCreator";
import AllPromotionsPage from "./sections/AllPromotionsPage";
import ProductCreator from "./sections/ProductCreator";
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
import JobRequestsSection from "./sections/JobRequestsSection";
import FAQSection from "../FAQ/FAQSection";
import Navbar from "../../components/Navbar/Navbar";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasProfessionalSubscription, sessionStatus, subscriptionPlan } =
    useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  const [view, setView] = useState("overview");
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSidebarMode, setIsMobileSidebarMode] = useState(false);
  const [isVideosModalOpen, setIsVideosModalOpen] = useState(false);
  const routeView = searchParams.get("view");

  const { data: myProfessional } = useQuery({
    queryKey: ["professional-me", professionalId],
    queryFn: async () => {
      const token = getAccessToken();
      const result = await getProfessionalMeAction({ token });
      return result?.data ?? null;
    },
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: proposalsCountData } = useQuery({
    queryKey: ["proposals-count", professionalId],
    queryFn: async () => {
      const token = await getAccessToken();
      const result = await getProposalsCountAction({ token });
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
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: !!professionalId,
  });

  const { data: videoStats } = useQuery({
    queryKey: ["video-stats", professionalId],
    queryFn: async () => {
      const result = await getVideoStatsByProfessionalAction({
        professionalId,
      });
      const raw = (result?.data as any) ?? result;
      return raw ?? null;
    },
    enabled: !!professionalId,
  });

  const profileViews = myProfessional?.profile_views ?? 0;

  const acceptedProposalsCount = proposalsCountData?.count ?? 0;

  const handleShowProposalsCreate = () =>
    router.push(`${ROUTES.dashboard}?view=proposals-create`);
  const handleShowProposalsView = () =>
    router.push(`${ROUTES.dashboard}?view=proposals-view`);
  const handleGoBack = () => router.push(ROUTES.dashboard);
  const handleGoProfile = () => router.push(`${ROUTES.dashboard}?view=profile`);
  const handleGoServices = () => router.push(ROUTES.services);
  const handleGoSettings = () => router.push(ROUTES.settings);
  const handleShowOverview = () => router.push(ROUTES.dashboard);
  const handleShowMessages = () => router.push(ROUTES.messages);
  const handleShowNotifications = () =>
    router.push(`${ROUTES.dashboard}?view=notifications`);
  const handleShowPromotionsCreate = (promo?: any) => {
    setEditingPromotion(promo || null);
    router.push(`${ROUTES.dashboard}?view=promotions-create`);
  };
  const handleShowPromotionsAll = () =>
    router.push(`${ROUTES.dashboard}?view=promotions-all`);
  const handleShowProducts = () =>
    router.push(`${ROUTES.dashboard}?view=products`);
  const handleShowServices = () =>
    router.push(`${ROUTES.dashboard}?view=services`);
  const handleShowSubscription = () =>
    router.push(`${ROUTES.dashboard}?view=subscription`);
  const handleShowCalendar = () =>
    router.push(`${ROUTES.dashboard}?view=calendar`);
  const handleShowBankPromos = () =>
    router.push(`${ROUTES.dashboard}?view=bank-promotions`);
  const handleShowProfile = () =>
    router.push(`${ROUTES.dashboard}?view=profile`);
  const handleShowReels = () => router.push(`${ROUTES.dashboard}?view=reels`);
  const handleShowJobRequests = () =>
    router.push(`${ROUTES.dashboard}?view=job-requests`);

  const isFreePlan = subscriptionPlan === "free";
  const isUnsubscribedProfessional =
    sessionStatus?.is_professional &&
    !sessionStatus?.subscription_plan &&
    !sessionStatus?.subscription;
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionStatus) return;

    const isProfessionalWithoutPlan =
      sessionStatus.is_professional &&
      !sessionStatus.subscription_plan &&
      !sessionStatus.subscription;

    const createdAt = sessionStatus.user_created_at
      ? new Date(sessionStatus.user_created_at).getTime()
      : 0;
    const lastSignIn = sessionStatus.user_last_sign_in_at
      ? new Date(sessionStatus.user_last_sign_in_at).getTime()
      : createdAt;

    const isWelcomeParam = searchParams.get("welcome") === "true";
    const hasSeenWelcome = localStorage.getItem(
      `welcome_shown_${sessionStatus.email}`,
    );

    // Si es profesional y no tiene plan, detenemos acá para que no muestre la bienvenida.
    // La bienvenida se mostrará cuando seleccione el plan y sea redirigido con ?welcome=true
    if (isProfessionalWithoutPlan) return;

    if (isWelcomeParam && !hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem(`welcome_shown_${sessionStatus.email}`, "true");
    } else if (createdAt > 0) {
      const isFirstTime = Math.abs(createdAt - lastSignIn) < 5 * 60 * 1000;
      if (isFirstTime && !hasSeenWelcome) {
        setShowWelcomeModal(true);
        localStorage.setItem(`welcome_shown_${sessionStatus.email}`, "true");
      }
    }
  }, [sessionStatus, searchParams]);

  const openPromoModal = () => setIsPromoModalOpen(true);
  const closePromoModal = () => setIsPromoModalOpen(false);
  const handleUpgradeRedirect = () => {
    setIsPromoModalOpen(false);
    router.push(`${ROUTES.dashboard}?view=subscription`);
  };

  const redirectIfFree = (target?: string) => {
    if (isFreePlan) {
      openPromoModal();
      return true;
    }
    if (target) router.push(`${ROUTES.dashboard}?view=${target}`);
    return false;
  };

  const blockedForFree = new Set([
    "proposals-create",
    "promotions-create",
    "promotions-all",
    "bank-promotions",
    "reels",
  ]);

  useEffect(() => {
    if (isFreePlan && blockedForFree.has(view)) {
      router.push(ROUTES.dashboard);
      openPromoModal();
    }
  }, [isFreePlan, view]);

  // Override handlers to block access for free plan
  const handleShowProposalsCreateBlocked = () =>
    redirectIfFree("proposals-create");
  const handleShowProposalsViewBlocked = () => {
    router.push(`${ROUTES.dashboard}?view=proposals-view`);
  };
  const handleShowPromotionsCreateBlocked = (promo?: any) => {
    if (isFreePlan) return redirectIfFree();
    setEditingPromotion(promo || null);
    router.push(`${ROUTES.dashboard}?view=promotions-create`);
  };
  const handleShowPromotionsAllBlocked = () => redirectIfFree("promotions-all");
  const handleShowBankPromosBlocked = () => redirectIfFree("bank-promotions");
  const handleShowReelsBlocked = () => redirectIfFree("reels");

  const openViewsForInactiveSubscription = new Set([
    "subscription",
    "notifications",
    "proposals-view",
    "job-requests",
    "referrals",
  ]);
  const shouldLockDashboardView =
    (!hasProfessionalSubscription || isUnsubscribedProfessional) &&
    !openViewsForInactiveSubscription.has(view);

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
      {isMobileSidebarMode && <Navbar />}
      <div
        className={`dashboard-page ${isMobileSidebarMode ? "dashboard-page--mobile" : ""}`}
      >
        {!isMobileSidebarMode && (
          <DashboardSidebar
            activeItem={view === "overview" ? "dashboard" : view}
            isCollapsed={isSidebarCollapsed}
            isMobile={false}
            isMobileOpen={false}
            onCloseMobile={() => {}}
            onToggle={handleSidebarToggle}
            onProposalsCreate={handleShowProposalsCreateBlocked}
            onProposalsView={handleShowProposalsViewBlocked}
            onDashboardClick={handleShowOverview}
            onMessagesClick={handleShowMessages}
            onNotificationsClick={handleShowNotifications}
            onPromotionsCreate={handleShowPromotionsCreateBlocked}
            onPromotionsViewAll={handleShowPromotionsAllBlocked}
            onProductsClick={handleShowProducts}
            onServicesClick={handleShowServices}
            onSubscriptionClick={handleShowSubscription}
            onCalendarClick={handleShowCalendar}
            onBankPromosClick={handleShowBankPromosBlocked}
            onProfileClick={handleShowProfile}
            onReelsClick={handleShowReelsBlocked}
            onJobRequestsClick={handleShowJobRequests}
          />
        )}

        <main
          className={`dashboard-main ${isSidebarCollapsed ? "dashboard-main--collapsed" : ""} ${isMobileSidebarMode ? "dashboard-main--mobile" : ""}`}
        >
          {isUnsubscribedProfessional && view !== "subscription" && (
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--accent-color)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4)",
                marginBottom: "var(--space-6)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--weight-bold)",
                    color: "var(--text-primary)",
                    marginBottom: "0.25rem",
                  }}
                >
                  ¡Activa tu suscripción profesional!
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Para desbloquear todas las herramientas de tu perfil, debes
                  activar un plan de suscripción.
                </p>
              </div>
              <button className="btn-primary" onClick={handleShowSubscription}>
                Ver planes
              </button>
            </div>
          )}

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
            ) : view === "products-create" ? (
              <ProductCreator onBack={handleShowProducts} />
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
            ) : view === "job-requests" ? (
              <JobRequestsSection />
            ) : view === "faq" ? (
              <FAQSection />
            ) : (
              <div className="dashboard-content">
                <div className="welcome-section">
                  <div className="welcome-copy">
                    <h1>¡Bienvenido de nuevo!</h1>
                  </div>

                  <div className="welcome-actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={handleGoSettings}
                    >
                      <Settings size={18} />
                      <span>Configuración de cuenta</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card compact-card">
                    <div className="card-header">
                      <Eye size={24} className="icon-orange" />
                    </div>
                    <div className="stat-value-group">
                      <span className="card-label">VISITAS A TU PERFIL</span>
                      <h2 className="big-value">
                        {profileViews !== null
                          ? profileViews.toLocaleString("es-AR")
                          : "--"}
                      </h2>
                    </div>
                  </div>

                  <div className="stat-card compact-card">
                    <div className="card-header">
                      <LayoutDashboard size={24} className="icon-purple" />
                    </div>
                    <div className="stat-value-group">
                      <span className="card-label">PRESUPUESTOS ACEPTADOS</span>
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
                      <h3 className="mid-value">Reels y videos</h3>
                    </div>
                    <div className="reels-stats-row">
                      <div className="stat-value-group">
                        <span className="card-label">VISTAS (REELS)</span>
                        <h2 className="mid-value">
                          {reelsStats?.total_views !== undefined
                            ? reelsStats.total_views >= 1000
                              ? `${(reelsStats.total_views / 1000).toFixed(1)}K`
                              : reelsStats.total_views
                            : "--"}
                        </h2>
                      </div>
                      <div className="stat-value-group">
                        <span className="card-label">ME GUSTA (REELS)</span>
                        <h2 className="mid-value">
                          {reelsStats?.total_likes !== undefined
                            ? reelsStats.total_likes >= 1000
                              ? `${(reelsStats.total_likes / 1000).toFixed(1)}K`
                              : reelsStats.total_likes
                            : "--"}
                        </h2>
                      </div>
                      <div className="stat-value-group">
                        <span className="card-label">VISTAS (VIDEOS)</span>
                        <h2 className="mid-value">
                          {videoStats?.total_views !== undefined
                            ? videoStats.total_views >= 1000
                              ? `${(videoStats.total_views / 1000).toFixed(1)}K`
                              : videoStats.total_views
                            : "--"}
                        </h2>
                      </div>
                      <div className="stat-value-group">
                        <span className="card-label">ME GUSTA (VIDEOS)</span>
                        <h2 className="mid-value">
                          {videoStats?.total_likes !== undefined
                            ? videoStats.total_likes >= 1000
                              ? `${(videoStats.total_likes / 1000).toFixed(1)}K`
                              : videoStats.total_likes
                            : "--"}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lower-grid">
                  <div className="section-container">
                    <div className="section-header">
                      <h2>Rendimiento de videos</h2>
                      <button
                        type="button"
                        className="view-all"
                        onClick={() => setIsVideosModalOpen(true)}
                      >
                        VER TODOS LOS VIDEOS
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
                                <video
                                  src={video.video_url}
                                  preload="metadata"
                                  className="video-thumb__preview"
                                />
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
                                <span>👍 {video.likes_count || 0}</span>
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
                      <h3>Acciones rápidas</h3>
                      <div className="actions-list">
                        <button
                          type="button"
                          className="action-btn-main"
                          onClick={handleShowProposalsCreateBlocked}
                        >
                          <div className="action-icon">
                            <Plus size={20} />
                          </div>
                          <span>Crear presupuesto</span>
                          <ChevronRight size={18} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={handleShowReelsBlocked}
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
                          <span>Configuración de cuenta</span>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {shouldLockDashboardView && (
              <div className="subscription-lock-overlay" role="alert">
                <div
                  className="subscription-lock-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    textAlign: "center",
                  }}
                >
                  <h3>Suscripción profesional requerida</h3>
                  <p>
                    Para acceder a esta sección necesitás una suscripción
                    profesional activa.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={handleShowSubscription}
                  >
                    Ver planes
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
        <Modal
          isOpen={isPromoModalOpen}
          onClose={closePromoModal}
          title="Mejorá tu cuenta"
        >
          <p>
            Para acceder a esta funcionalidad necesitás una suscripción
            profesional.
          </p>
          <div className="upgrade-actions">
            <button
              type="button"
              className="action-btn"
              onClick={closePromoModal}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="action-btn-main"
              onClick={handleUpgradeRedirect}
            >
              Ver planes
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={isVideosModalOpen}
          onClose={() => setIsVideosModalOpen(false)}
          title="Todos los videos"
        >
          <div className="dashboard-videos-modal-grid">
            {professionalVideos.length > 0 ? (
              professionalVideos.map((video) => (
                <div key={video.id} className="video-card">
                  <div className="video-thumb">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title || "Video"}
                      />
                    ) : (
                      <video
                        src={video.video_url}
                        preload="metadata"
                        className="video-thumb__preview"
                      />
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
                      <span>👍 {video.likes_count || 0}</span>
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
        </Modal>

        <Modal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          title="¡Bienvenido a Sercio Profesional!"
          maxWidth="600px"
        >
          <div style={{ padding: "var(--space-4)", textAlign: "center" }}>
            <p
              style={{
                marginBottom: "var(--space-6)",
                color: "var(--text-secondary)",
                fontSize: "var(--text-md)",
              }}
            >
              Para comenzar a utilizar tu panel y acceder a todas las
              herramientas, debés elegir un plan. Esto es un resumen de lo que
              podrás hacer:
            </p>
            <ul
              style={{
                textAlign: "left",
                marginBottom: "var(--space-8)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
                padding: "0 var(--space-4)",
              }}
            >
              <li
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                }}
              >
                <span
                  style={{ color: "var(--success-color)", marginTop: "2px" }}
                >
                  ✅
                </span>
                <span>
                  <strong>Presupuestos:</strong> Recibir y enviar propuestas a
                  clientes cercanos a tu zona.
                </span>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                }}
              >
                <span
                  style={{ color: "var(--success-color)", marginTop: "2px" }}
                >
                  ✅
                </span>
                <span>
                  <strong>Promociones:</strong> Crear ofertas ilimitadas para
                  destacar tus servicios y productos.
                </span>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                }}
              >
                <span
                  style={{ color: "var(--success-color)", marginTop: "2px" }}
                >
                  ✅
                </span>
                <span>
                  <strong>Agenda:</strong> Sincronizar tu Google Calendar para
                  gestionar tus citas automáticamente.
                </span>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                }}
              >
                <span
                  style={{ color: "var(--success-color)", marginTop: "2px" }}
                >
                  ✅
                </span>
                <span>
                  <strong>Perfil Público:</strong> Tener un perfil profesional
                  con tu portafolio de trabajos y reseñas de clientes.
                </span>
              </li>
            </ul>
            <button
              className="btn-primary"
              style={{ width: "100%", padding: "var(--space-4)" }}
              onClick={() => {
                setShowWelcomeModal(false);
                if (isUnsubscribedProfessional) {
                  handleShowSubscription();
                } else {
                  router.replace(ROUTES.dashboard);
                }
              }}
            >
              ¡Empezar ahora!
            </button>
          </div>
        </Modal>
      </div>

      {isUnsubscribedProfessional && (
        <div
          className="subscription-confirm-overlay"
          style={{
            zIndex: 1000,
            padding: "20px",
            overflowY: "auto",
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "1000px",
              width: "100%",
              marginTop: "5vh",
            }}
          >
            <RegisterPlanSelection />
          </div>
        </div>
      )}
    </div>
  );
}
