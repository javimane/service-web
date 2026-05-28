"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Play,
  Pause,
  Heart,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  MapPin,
  Volume2,
  VolumeX,
  Search,
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getReelsAction, updateReelStatsAction } from "../../app/actions/reels";
import { getProvincesAction } from "@/app/actions/provinces";
import { getSubscriptionByProfessionalAction } from "@/app/actions/subscriptions";
import type { ProfessionalReelRow } from "../../types/database.types";
import { getProfilePath } from "../../utils/utils";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import "./ReelsPage.css";

// Individual Reel Card with hover-to-play preview
function ReelCard({
  reel,
  isPremium,
  onClick,
}: {
  reel: ProfessionalReelRow;
  isPremium: boolean;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0.01;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0.01;
    }
  };

  return (
    <div
      className={`reels-grid-card ${isPremium ? "is-premium" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div className="reels-grid-card__video-wrapper">
        <video
          ref={videoRef}
          className="reels-grid-card__video"
          src={reel.video_url}
          muted
          playsInline
          loop
          preload="metadata"
        />
        <div className="reels-grid-card__overlay">
          <div className="reels-grid-card__play-btn">
            <Play size={20} fill="currentColor" />
          </div>
        </div>
      </div>

      {isPremium && (
        <div className="reels-grid-card__premium-badge">
          <Sparkles size={12} fill="currentColor" />
          <span>Destacado</span>
        </div>
      )}

      <div className="reels-grid-card__info">
        <div className="reels-grid-card__professional">
          <img
            src={
              reel.Professional?.Profile?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                reel.Professional?.Profile?.display_name || "P"
              )}`
            }
            alt={reel.Professional?.Profile?.display_name || "Profesional"}
            className="reels-grid-card__avatar"
          />
          <span className="reels-grid-card__name">
            {reel.Professional?.Profile?.display_name || "Profesional"}
          </span>
        </div>
        {reel.title && <h3 className="reels-grid-card__title">{reel.title}</h3>}
        <div className="reels-grid-card__stats">
          <span>{reel.views_count || 0} vistas</span>
          <span>•</span>
          <span>{reel.likes || 0} likes</span>
        </div>
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const router = useRouter();
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("All");
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [likedReels, setLikedReels] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const theaterVideoRef = useRef<HTMLVideoElement>(null);

  // Fetch provinces
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Fetch Reels filtered by province
  const { data: reels = [], isLoading: isLoadingReels } = useQuery<
    ProfessionalReelRow[]
  >({
    queryKey: ["all-reels-view", selectedProvinceId],
    queryFn: async () => {
      const provinceId =
        selectedProvinceId === "All" ? undefined : Number(selectedProvinceId);
      const result = await getReelsAction({ provinceId });
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Extract unique professional IDs
  const professionalIds = useMemo<number[]>(() => {
    const ids = reels.map((r) => r.professional_id).filter(Boolean);
    return [...new Set(ids)];
  }, [reels]);

  // Fetch subscriptions for each professional
  const subscriptionQueries = useQueries({
    queries: professionalIds.map((id) => ({
      queryKey: ["professional-subscription-reels-page", id],
      queryFn: async () => {
        const result = await getSubscriptionByProfessionalAction({
          professionalId: id,
        });
        return result?.data ?? null;
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  const subscriptionsMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    subscriptionQueries.forEach((query, index) => {
      const professionalId = professionalIds[index];
      if (query.data && professionalId !== undefined) {
        map[professionalId] = (query.data as any).data ?? query.data;
      }
    });
    return map;
  }, [subscriptionQueries, professionalIds]);

  const isLoading =
    isLoadingReels || subscriptionQueries.some((q) => q.isLoading);

  // Process and sort: Premium/Featured first
  const processedReels = useMemo(() => {
    return [...reels].sort((a, b) => {
      const aSub = subscriptionsMap[a.professional_id];
      const bSub = subscriptionsMap[b.professional_id];
      const aPremium = aSub?.type === "premium" || aSub?.is_premium ? 1 : 0;
      const bPremium = bSub?.type === "premium" || bSub?.is_premium ? 1 : 0;
      return bPremium - aPremium;
    });
  }, [reels, subscriptionsMap]);

  const activeReel =
    selectedReelIndex !== null ? processedReels[selectedReelIndex] : null;

  // Handle keyboard navigation in theater mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedReelIndex === null) return;
      if (e.key === "ArrowRight") {
        handleNextReel();
      } else if (e.key === "ArrowLeft") {
        handlePrevReel();
      } else if (e.key === "Escape") {
        setSelectedReelIndex(null);
      } else if (e.key === " ") {
        e.preventDefault();
        toggleTheaterPlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedReelIndex, processedReels.length]);

  // Handle tracking view and playing video when active reel changes
  useEffect(() => {
    if (activeReel && theaterVideoRef.current) {
      // Increment views
      updateReelStatsAction({ id: activeReel.id, data: { views: 1 } });

      const video = theaterVideoRef.current;
      video.currentTime = 0;
      void video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [activeReel]);

  const handleNextReel = () => {
    if (selectedReelIndex === null) return;
    setSelectedReelIndex((selectedReelIndex + 1) % processedReels.length);
  };

  const handlePrevReel = () => {
    if (selectedReelIndex === null) return;
    setSelectedReelIndex(
      (selectedReelIndex - 1 + processedReels.length) % processedReels.length
    );
  };

  const toggleTheaterPlayback = () => {
    const video = theaterVideoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleTheaterMute = () => {
    const video = theaterVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleTheaterLike = () => {
    if (!activeReel) return;
    const isLiked = likedReels.includes(activeReel.id);
    if (!isLiked) {
      updateReelStatsAction({ id: activeReel.id, data: { likes: 1 } });
      setLikedReels((prev) => [...prev, activeReel.id]);
    } else {
      setLikedReels((prev) => prev.filter((id) => id !== activeReel.id));
    }
  };

  const handleRestartReel = () => {
    if (theaterVideoRef.current) {
      theaterVideoRef.current.currentTime = 0;
      void theaterVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <>
      <SEO
        title="Reels Profesionales - Cercio"
        description="Explorá videos cortos y creativos de profesionales locales en Cercio. Mirá sus trabajos, técnicas y proyectos en acción."
      />
      <Navbar />

      <main className="reels-view-page">
        {/* Hero Section */}
        <section className="reels-hero">
          <div className="reels-container">
            <div className="reels-hero__content">
              <div className="reels-hero__sparkle">
                <Sparkles size={20} className="text-coral reels-hero__sparkle-icon" />
                <span>Sercio Reels</span>
              </div>
              <h1 className="reels-hero__title">
                Inspiración en <span className="text-coral">Movimiento</span>
              </h1>
              <p className="reels-hero__subtitle">
                Descubrí el talento local a través de videos cortos y creativos. Conectá directamente con profesionales en acción y tus comerciantes preferidos.
              </p>

              {/* Province Selector */}
              <div className="reels-hero__filter">
                <div className="reels-filter-box">
                  <MapPin size={18} className="reels-filter-icon" />
                  <select
                    value={selectedProvinceId}
                    onChange={(e) => setSelectedProvinceId(e.target.value)}
                    className="reels-filter-select"
                  >
                    <option value="All">Todas las provincias</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="reels-content">
          <div className="reels-container">
            {isLoading ? (
              <div className="reels-page-loading">
                <Loader2 className="animate-spin text-coral" size={48} />
                <p>Cargando reels del talento local...</p>
              </div>
            ) : processedReels.length === 0 ? (
              <div className="reels-page-empty">
                <div className="reels-page-empty__icon-wrapper">
                  <Sparkles size={48} className="text-coral" />
                </div>
                <h2>¿No encontrás reels?</h2>
                <p>Aún no hay videos subidos en la provincia seleccionada. ¡Volvé a consultar pronto!</p>
                <button
                  className="reels-reset-btn"
                  onClick={() => setSelectedProvinceId("All")}
                >
                  Ver todas las provincias
                </button>
              </div>
            ) : (
              <div className="reels-grid">
                {processedReels.map((reel, index) => {
                  const sub = subscriptionsMap[reel.professional_id];
                  const isPremium = sub?.type === "premium" || sub?.is_premium;
                  return (
                    <ReelCard
                      key={reel.id}
                      reel={reel}
                      isPremium={!!isPremium}
                      onClick={() => setSelectedReelIndex(index)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Full-Screen Theater Modal */}
        {activeReel && (
          <div
            className="reels-theater"
            onClick={() => setSelectedReelIndex(null)}
          >
            {/* Navigations */}
            <button
              type="button"
              className="reels-theater__nav reels-theater__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevReel();
              }}
              aria-label="Reel anterior"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              type="button"
              className="reels-theater__nav reels-theater__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                handleNextReel();
              }}
              aria-label="Siguiente reel"
            >
              <ChevronRight size={24} />
            </button>

            <button
              type="button"
              className="reels-theater__close"
              onClick={() => setSelectedReelIndex(null)}
              aria-label="Cerrar reproductor"
            >
              <X size={20} />
            </button>

            {/* Smartphone Container Frame */}
            <div
              className="reels-theater__container"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                ref={theaterVideoRef}
                className="reels-theater__video"
                src={activeReel.video_url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
              />

              {/* Theater UI Overlays */}
              {/* Profile Bar */}
              <div className="reels-theater__profile-bar">
                <a
                  href={getProfilePath(
                    activeReel.professional_id,
                    activeReel.Professional?.seo_path
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reels-theater__profile-info"
                >
                  <img
                    src={
                      activeReel.Professional?.Profile?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        activeReel.Professional?.Profile?.display_name || "P"
                      )}`
                    }
                    alt={activeReel.Professional?.Profile?.display_name || "P"}
                    className="reels-theater__profile-avatar"
                  />
                  <div className="reels-theater__profile-text">
                    <span className="reels-theater__profile-name">
                      {activeReel.Professional?.Profile?.display_name ||
                        "Profesional"}
                    </span>
                    {subscriptionsMap[activeReel.professional_id]?.type === "premium" && (
                      <span className="reels-theater__premium-tag">
                        <Sparkles size={8} fill="currentColor" /> Premium
                      </span>
                    )}
                  </div>
                </a>
              </div>

              {/* Controls & Actions Sidebar */}
              <div className="reels-theater__sidebar">
                {/* Like Button */}
                <button
                  type="button"
                  className={`reels-theater__action-btn ${
                    likedReels.includes(activeReel.id) ? "is-active" : ""
                  }`}
                  onClick={toggleTheaterLike}
                >
                  <Heart
                    size={22}
                    fill={
                      likedReels.includes(activeReel.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                  <span>{activeReel.likes || 0}</span>
                </button>

                {/* Sound Button */}
                <button
                  type="button"
                  className="reels-theater__action-btn"
                  onClick={toggleTheaterMute}
                >
                  {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  <span>Audio</span>
                </button>

                {/* Restart Button */}
                <button
                  type="button"
                  className="reels-theater__action-btn"
                  onClick={handleRestartReel}
                >
                  <RotateCcw size={20} />
                  <span>Reiniciar</span>
                </button>

                {/* Play/Pause Button */}
                <button
                  type="button"
                  className="reels-theater__action-btn"
                  onClick={toggleTheaterPlayback}
                >
                  {isPlaying ? (
                    <Pause size={22} />
                  ) : (
                    <Play size={22} fill="currentColor" />
                  )}
                  <span>{isPlaying ? "Pausa" : "Play"}</span>
                </button>
              </div>

              {/* Details Bottom Overlay */}
              <div className="reels-theater__details">
                {activeReel.title && (
                  <h2 className="reels-theater__title">{activeReel.title}</h2>
                )}
                {activeReel.description && (
                  <p className="reels-theater__description">
                    {activeReel.description}
                  </p>
                )}
                <div className="reels-theater__metadata">
                  <span>{activeReel.views_count || 0} reproducciones</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
