"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Heart,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  updateReelStatsAction,
  upsertReelLikeAction,
} from "@/app/actions/reels";
import { getProfilePath } from "@/utils/utils";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAlert } from "@/context/AlertContext";
import { getAccessToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

interface ReelsTheaterModalProps {
  reels: any[];
  initialIndex: number;
  onClose: () => void;
  isPremiumMap?: Record<string | number, boolean>;
}

export default function ReelsTheaterModal({
  reels,
  initialIndex,
  onClose,
  isPremiumMap = {},
}: ReelsTheaterModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const { showSuccess } = useAlert();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string | number>>(new Set());
  const theaterVideoRef = useRef<HTMLVideoElement>(null);
  const initialUrlRef = useRef(typeof window !== "undefined" ? window.location.pathname + window.location.search : "");

  const activeReel = reels[currentIndex];

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && initialUrlRef.current) {
        window.history.replaceState(null, "", initialUrlRef.current);
      }
    };
  }, []);

  const activeReelId = activeReel?.id;
  const activeReelSeoPath = activeReel?.seo_path;

  useEffect(() => {
    if (activeReelId && theaterVideoRef.current) {
      // Increment views
      updateReelStatsAction({ id: activeReelId, data: { views: 1 } });

      const video = theaterVideoRef.current;
      video.currentTime = 0;
      void video.play().catch(() => {});
      setIsPlaying(true);

      const cleanSeo = activeReelSeoPath
        ? activeReelSeoPath.startsWith("/")
          ? activeReelSeoPath
          : `/${activeReelSeoPath}`
        : `/${activeReelId}`;
      const url = cleanSeo.startsWith("/reels") ? cleanSeo : `/reels${cleanSeo}`;
      window.history.replaceState(null, "", url);
    }
  }, [activeReelId, activeReelSeoPath]);

  const handleNextReel = () => {
    setCurrentIndex((prev) => (prev + 1) % reels.length);
  };

  const handlePrevReel = () => {
    setCurrentIndex((prev) => (prev - 1 + reels.length) % reels.length);
  };

  const togglePlayback = () => {
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

  const toggleMute = () => {
    const video = theaterVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleRestart = () => {
    if (theaterVideoRef.current) {
      theaterVideoRef.current.currentTime = 0;
      void theaterVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleLike = async () => {
    if (!activeReel) return;
    if (!user) {
      openAuth("login");
      return;
    }
    const alreadyLiked = likedReels.has(activeReel.id);
    const newIsLike = !alreadyLiked;

    setLikedReels((prev) => {
      const next = new Set(prev);
      if (newIsLike) next.add(activeReel.id);
      else next.delete(activeReel.id);
      return next;
    });

    try {
      const token = getAccessToken();
      await upsertReelLikeAction({
        id: activeReel.id,
        is_like: newIsLike,
        token,
      });
    } catch {
      setLikedReels((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) next.add(activeReel.id);
        else next.delete(activeReel.id);
        return next;
      });
    }
  };

  const handleShare = () => {
    if (!activeReel) return;
    const seoPath = activeReel.seo_path;
    const cleanSeo = seoPath
      ? seoPath.startsWith("/")
        ? seoPath
        : `/${seoPath}`
      : `/${activeReel.id}`;
    const shareUrl = `${window.location.origin}${cleanSeo.startsWith("/reels") ? cleanSeo : `/reels${cleanSeo}`}`;

    if (navigator.share) {
      navigator
        .share({
          title: activeReel.title || "Reel de Sercio",
          text: activeReel.description || "Mirá este reel en Sercio",
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showSuccess("¡Enlace de compartir copiado al portapapeles!");
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNextReel();
      } else if (e.key === "ArrowLeft") {
        handlePrevReel();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, reels.length]);

  if (!activeReel) return null;

  const professional = activeReel.Professional || activeReel.professional;
  const profile = professional?.Profile || professional?.profile;
  const companies = professional?.companies || professional?.Companies || [];
  const company = Array.isArray(companies) ? companies[0] : companies;
  const companyName = company?.name;
  const displayName = companyName || profile?.display_name || "Profesional";
  const avatar =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;
  const professionalId = activeReel.professional_id || professional?.id;
  const isPremium = isPremiumMap[professionalId] || activeReel.isPremium;

  return (
    <div className="reels-theater" onClick={onClose}>
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
        onClick={onClose}
        aria-label="Cerrar reproductor"
      >
        <X size={20} />
      </button>

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

        <div className="reels-theater__profile-bar">
          <a
            href={getProfilePath(professionalId, professional?.seo_path)}
            className="reels-theater__profile-info"
            onClick={(e) => {
              e.preventDefault();
              router.push(
                getProfilePath(professionalId, professional?.seo_path),
              );
              onClose();
            }}
          >
            <img
              src={avatar}
              alt={displayName}
              className="reels-theater__profile-avatar"
            />
            <div className="reels-theater__profile-text">
              <span className="reels-theater__profile-name">{displayName}</span>
              {isPremium && (
                <span className="reels-theater__premium-tag">
                  <Sparkles size={8} fill="currentColor" /> Premium
                </span>
              )}
            </div>
          </a>
        </div>

        <div className="reels-theater__sidebar">
          {/* Like Button */}
          <button
            type="button"
            className={`reels-theater__action-btn ${
              likedReels.has(activeReel.id) ? "is-active" : ""
            }`}
            onClick={toggleLike}
          >
            <Heart
              size={22}
              fill={likedReels.has(activeReel.id) ? "currentColor" : "none"}
            />
            <span>{activeReel.likes_count || 0}</span>
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
            onClick={handleRestart}
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

          {/* Share Button */}
          <button
            type="button"
            className="reels-theater__action-btn"
            onClick={handleShare}
          >
            <Share2 size={20} />
            <span>Compartir</span>
          </button>
        </div>

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
  );
}
