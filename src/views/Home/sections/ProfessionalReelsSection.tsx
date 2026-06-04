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
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { ROUTES } from "../../../routes/paths";
import {
  getReelsAction,
  updateReelStatsAction,
} from "../../../app/actions/reels";
import { getProvincesAction } from "@/app/actions/provinces";
import { getSubscriptionByProfessionalAction } from "@/app/actions/subscriptions";
import type { ProfessionalReelRow } from "../../../types/database.types";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import { getProfilePath } from "../../../utils/utils";
import "./ProfessionalReelsSection.css";
import "../../Reels/ReelsPage.css"; // Reuse theater styles

function ReelThumbnail({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.currentTime = 0.01;
  }, [src]);
  return (
    <video
      ref={ref}
      className="reel-card__poster"
      src={src}
      muted
      playsInline
      preload="metadata"
    />
  );
}

export default function ProfessionalReelsSection({ userProvince = "Buenos Aires" }: { userProvince?: string }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<number[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Using userProvince from props
  // Fetch Provinces to get the ID for filtering
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24,
  });

  const provinceId = useMemo(() => {
    return provinces.find((p) => p.name === userProvince)?.id;
  }, [provinces, userProvince]);

  const { data: allReels = [], isLoading: isLoadingReels } = useQuery<
    ProfessionalReelRow[]
  >({
    queryKey: ["professional-reels", provinceId],
    queryFn: async () => {
      const result = await getReelsAction({ provinceId });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: !!provinceId || userProvince === "Buenos Aires",
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  // Get unique professional IDs to avoid redundant queries
  const professionalIds = useMemo<number[]>(() => {
    const ids = allReels.map((r) => r.professional_id).filter(Boolean);
    return [...new Set(ids)];
  }, [allReels]);

  // Fetch subscriptions for each professional in parallel
  const subscriptionQueries = useQueries({
    queries: professionalIds.map((id) => ({
      queryKey: ["professional-subscription", id],
      queryFn: async () => {
        const result = await getSubscriptionByProfessionalAction({
          professionalId: id,
        });
        return result?.data ?? null;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes cache
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

  const processedReels = useMemo(() => {
    return [...allReels]
      .sort((a, b) => {
        const aSub = subscriptionsMap[a.professional_id];
        const bSub = subscriptionsMap[b.professional_id];

        // Priority logic: Premium first.
        // We assume the subscription object has an is_premium or type field.
        const aPremium = aSub?.type === "premium" || aSub?.is_premium ? 1 : 0;
        const bPremium = bSub?.type === "premium" || bSub?.is_premium ? 1 : 0;

        return bPremium - aPremium;
      })
      .slice(0, 25);
  }, [allReels, subscriptionsMap]);

  const selectedReel =
    selectedIndex !== null ? processedReels[selectedIndex] : null;

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".reel-card");

  useEffect(() => {
    if (selectedReel && videoRef.current) {
      // Increment views
      updateReelStatsAction({ id: selectedReel.id, data: { views: 1 } });

      const video = videoRef.current;
      video.currentTime = 0;
      void video.play().catch(() => undefined);
      setIsPlaying(true);
    }
  }, [selectedReel]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleLike = () => {
    if (!selectedReel) return;

    const isLiked = likedReels.includes(selectedReel.id);

    // Only increment if not already liked (simple client-side check)
    if (!isLiked) {
      updateReelStatsAction({ id: selectedReel.id, data: { likes: 1 } });
    }

    setLikedReels((prev) =>
      isLiked
        ? prev.filter((id) => id !== selectedReel.id)
        : [...prev, selectedReel.id],
    );
  };

  const restartReel = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    void video.play().catch(() => undefined);
    setIsPlaying(true);
  };

  const showPreviousReel = () => {
    setSelectedIndex((prev) =>
      prev === null
        ? 0
        : (prev - 1 + processedReels.length) % processedReels.length,
    );
  };

  const showNextReel = () => {
    setSelectedIndex((prev) =>
      prev === null ? 0 : (prev + 1) % processedReels.length,
    );
  };

  return (
    <section className="professional-reels">
      <div className="home-section-container">
        <div className="professional-reels__header">
          <div className="professional-reels__title-group">
            <h2 className="professional-reels__title">Reels Profesionales</h2>
            <span className="professional-reels__location">
              <MapPin size={14} />
              {userProvince}
            </span>
          </div>
          <button
            type="button"
            className="section-link"
            onClick={() => window.location.href = ROUTES.reels}
          >
            Ver todo <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
        <div className="professional-reels__carousel-wrapper">
          {isLoading ? (
            <div className="reels-loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Cargando reels...</p>
            </div>
          ) : processedReels.length === 0 ? (
            <div className="reels-empty">
              <Sparkles size={40} />
              <p>Aún no hay reels en {userProvince}</p>
            </div>
          ) : (
            <>
              <button
                className={`carousel-control carousel-control--left ${showLeftArrow ? "" : "carousel-control--hidden"}`}
                type="button"
                onClick={() => scrollCarousel(-1)}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                ref={sliderRef}
                className="professional-reels__scroll"
                onScroll={updateArrowVisibility}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {processedReels.map((reel, index) => (
                  <button
                    key={reel.id}
                    className="reel-card"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <ReelThumbnail src={reel.video_url} />
                    {subscriptionsMap[reel.professional_id]?.type ===
                      "premium" && (
                      <div className="premium-badge-mini">
                        <Sparkles size={10} fill="currentColor" />
                      </div>
                    )}
                    <div className="reel-card__overlay" />
                    <div className="reel-card__label">
                      <Play size={14} fill="white" />
                      <span>Video</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                className={`carousel-control carousel-control--right ${showRightArrow ? "" : "carousel-control--hidden"}`}
                type="button"
                onClick={() => scrollCarousel(1)}
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {selectedReel && (
        <div
          className="reels-theater"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Navigations */}
          <button
            type="button"
            className="reels-theater__nav reels-theater__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              showPreviousReel();
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
              showNextReel();
            }}
            aria-label="Siguiente reel"
          >
            <ChevronRight size={24} />
          </button>

          <button
            type="button"
            className="reels-theater__close"
            onClick={() => setSelectedIndex(null)}
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
              ref={videoRef}
              className="reels-theater__video"
              src={selectedReel.video_url}
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
                  selectedReel.professional_id,
                  selectedReel.Professional?.seo_path
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="reels-theater__profile-info"
              >
                <img
                  src={
                    selectedReel.Professional?.Profile?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedReel.Professional?.Profile?.display_name || "P"
                    )}`
                  }
                  alt={selectedReel.Professional?.Profile?.display_name || "P"}
                  className="reels-theater__profile-avatar"
                />
                <div className="reels-theater__profile-text">
                  <span className="reels-theater__profile-name">
                    {selectedReel.Professional?.Profile?.display_name ||
                      "Profesional"}
                  </span>
                  {subscriptionsMap[selectedReel.professional_id]?.type === "premium" && (
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
                  likedReels.includes(selectedReel.id) ? "is-active" : ""
                }`}
                onClick={toggleLike}
              >
                <Heart
                  size={22}
                  fill={
                    likedReels.includes(selectedReel.id)
                      ? "currentColor"
                      : "none"
                  }
                />
                <span>{selectedReel.likes || 0}</span>
              </button>

              {/* Sound Button */}
              <button
                type="button"
                className="reels-theater__action-btn"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                <span>Audio</span>
              </button>

              {/* Restart Button */}
              <button
                type="button"
                className="reels-theater__action-btn"
                onClick={restartReel}
              >
                <RotateCcw size={20} />
                <span>Reiniciar</span>
              </button>

              {/* Play/Pause Button */}
              <button
                type="button"
                className="reels-theater__action-btn"
                onClick={togglePlayback}
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
              {selectedReel.title && (
                <h2 className="reels-theater__title">{selectedReel.title}</h2>
              )}
              {selectedReel.description && (
                <p className="reels-theater__description">
                  {selectedReel.description}
                </p>
              )}
              <div className="reels-theater__metadata">
                <span>{selectedReel.views_count || 0} reproducciones</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
