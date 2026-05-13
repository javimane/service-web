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
  MapPin
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { reelsService } from "../../../services/reelsService";
import { locationService } from "../../../services/locationService";
import { suscriptions } from "../../../services/suscriptionService";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import { getProfilePath } from "../../../utils/utils";
import "./ProfessionalReelsSection.css";

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

export default function ProfessionalReelsSection() {
  const [userProvince] = useState<string>(localStorage.getItem("userProvince") || "Buenos Aires");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<number[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch Provinces to get the ID for filtering
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: () => locationService.getProvinces(),
  });

  const provinceId = useMemo(() => {
    return provinces.find(p => p.name === userProvince)?.id;
  }, [provinces, userProvince]);

  const { data: allReels = [], isLoading: isLoadingReels } = useQuery({
    queryKey: ["professional-reels", provinceId],
    queryFn: () => reelsService.list(provinceId),
    enabled: !!provinceId || userProvince === "Buenos Aires",
  });

  // Get unique professional IDs to avoid redundant queries
  const professionalIds = useMemo(() => {
    const ids = allReels.map(r => r.professional_id).filter(Boolean);
    return [...new Set(ids)];
  }, [allReels]);

  // Fetch subscriptions for each professional in parallel
  const subscriptionQueries = useQueries({
    queries: professionalIds.map(id => ({
      queryKey: ["professional-subscription", id],
      queryFn: () => suscriptions.getByProfessional(id),
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    })),
  });

  const subscriptionsMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    subscriptionQueries.forEach((query, index) => {
      if (query.data) {
        map[professionalIds[index]] = query.data.data;
      }
    });
    return map;
  }, [subscriptionQueries, professionalIds]);

  const isLoading = isLoadingReels || subscriptionQueries.some(q => q.isLoading);

  const processedReels = useMemo(() => {
    return [...allReels]
      .sort((a, b) => {
        const aSub = subscriptionsMap[a.professional_id];
        const bSub = subscriptionsMap[b.professional_id];
        
        // Priority logic: Premium first. 
        // We assume the subscription object has an is_premium or type field.
        const aPremium = aSub?.type === 'premium' || aSub?.is_premium ? 1 : 0;
        const bPremium = bSub?.type === 'premium' || bSub?.is_premium ? 1 : 0;
        
        return bPremium - aPremium;
      })
      .slice(0, 25);
  }, [allReels, subscriptionsMap]);

  const selectedReel = selectedIndex !== null ? processedReels[selectedIndex] : null;

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

  const toggleLike = () => {
    if (!selectedReel) return;

    setLikedReels((prev) =>
      prev.includes(selectedReel.id)
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
      prev === null ? 0 : (prev - 1 + processedReels.length) % processedReels.length,
    );
  };

  const showNextReel = () => {
    setSelectedIndex((prev) => (prev === null ? 0 : (prev + 1) % processedReels.length));
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
          <button className="section-link">View all <span>&gt;</span></button>
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
                  {subscriptionsMap[reel.professional_id]?.type === 'premium' && (
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
          className="reels-modal-overlay"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="reels-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="reels-modal__nav reels-modal__nav--left"
              onClick={showPreviousReel}
              aria-label="Reel anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className="reels-modal__nav reels-modal__nav--right"
              onClick={showNextReel}
              aria-label="Siguiente reel"
            >
              <ChevronRight size={20} />
            </button>

            <button
              type="button"
              className="reels-modal__close"
              onClick={() => setSelectedIndex(null)}
              aria-label="Cerrar reel"
            >
              <X size={18} />
            </button>

            <div className="reels-modal__phone-frame">
              <video
                ref={videoRef}
                className="reels-modal__video"
                src={selectedReel.video_url}
                autoPlay
                loop
                muted
                playsInline
              />

              <div className="reels-modal__topbar reels-modal__topbar--profile">
                <a
                  className="reels-modal__profile-link"
                  href={getProfilePath(selectedReel.professional_id, selectedReel.Professional?.seo_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <img
                    src={selectedReel.Professional?.Profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReel.Professional?.Profile?.display_name || "P")}`}
                    alt={selectedReel.Professional?.Profile?.display_name}
                    className="reels-modal__profile-avatar"
                  />
                  <span className="reels-modal__profile-name">
                    {selectedReel.Professional?.Profile?.display_name || "Profesional"}
                  </span>
                </a>
              </div>

              <button
                type="button"
                className="reels-modal__center-control"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>

              <div className="reels-modal__actions">
                <button
                  type="button"
                  className={`reels-modal__icon-btn ${likedReels.includes(selectedReel.id) ? "is-active" : ""}`}
                  onClick={toggleLike}
                  aria-label="Me gusta"
                >
                  <Heart
                    size={18}
                    fill={
                      likedReels.includes(selectedReel.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>

                <button
                  type="button"
                  className="reels-modal__icon-btn"
                  onClick={restartReel}
                  aria-label="Reiniciar reel"
                >
                  <RotateCcw size={17} />
                </button>
              </div>

              <div className="reels-modal__meta">
                <div className="reels-modal__badge">
                  <span>{isPlaying ? "Reproduciendo" : "En pausa"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
