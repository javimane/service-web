"use client";

import { useRef, useState } from "react";
import { Play, Sparkles, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getProfilePath } from "@/utils/utils";
import { useAlert } from "@/context/AlertContext";

interface ReelCardProps {
  reel: any;
  isPremium: boolean;
  onClick: () => void;
}

export default function ReelCard({ reel, isPremium, onClick }: ReelCardProps) {
  const router = useRouter();
  const { showSuccess } = useAlert();
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

  const professional = reel.Professional || reel.professional;
  const profile = professional?.Profile || professional?.profile;
  const companies = professional?.companies || professional?.Companies || [];
  const company = Array.isArray(companies) ? companies[0] : companies;
  const companyName = company?.name;
  const displayName = companyName || profile?.display_name || "Profesional";
  const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;
  const professionalId = reel.professional_id || professional?.id;

  const handleProfessionalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(getProfilePath(professionalId, professional?.seo_path));
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const seoPath = reel.seo_path;
    const cleanSeo = seoPath ? (seoPath.startsWith("/") ? seoPath : `/${seoPath}`) : `/${reel.id}`;
    const shareUrl = `${window.location.origin}${cleanSeo.startsWith("/reels") ? cleanSeo : `/reels${cleanSeo}`}`;

    if (navigator.share) {
      navigator.share({
        title: reel.title || "Reel de Sercio",
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showSuccess("¡Enlace de compartir copiado al portapapeles!");
      });
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

      <div className="reels-grid-card__info" onClick={(e) => e.stopPropagation()}>
        <div className="reels-grid-card__professional" onClick={handleProfessionalClick}>
          <img
            src={avatar}
            alt={displayName}
            className="reels-grid-card__avatar"
          />
          <span className="reels-grid-card__name">
            {displayName}
          </span>
        </div>
        <div className="reels-grid-card__click-area" onClick={onClick}>
          {reel.title && <h3 className="reels-grid-card__title">{reel.title}</h3>}
          <div className="reels-grid-card__stats">
            <span>{reel.views_count || 0} vistas</span>
            <span>•</span>
            <span>{reel.likes_count || 0} likes</span>
          </div>
        </div>
        <button
          type="button"
          className="reels-grid-card__share-btn"
          onClick={handleShareClick}
        >
          <Share2 size={14} />
          <span>Compartir</span>
        </button>
      </div>
    </div>
  );
}
