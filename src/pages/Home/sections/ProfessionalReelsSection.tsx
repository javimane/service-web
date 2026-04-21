import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Heart,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./ProfessionalReelsSection.css";

const reels = [
  {
    id: 1,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    professional: {
      id: "juanperez",
      name: "Juan Pérez",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  },
  {
    id: 2,
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    professional: {
      id: "mariagomez",
      name: "María Gómez",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  },
  {
    id: 3,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    professional: {
      id: "carlossosa",
      name: "Carlos Sosa",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    },
  },
  {
    id: 4,
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    professional: {
      id: "lauradiaz",
      name: "Laura Díaz",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
  },
  {
    id: 5,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    professional: {
      id: "robertolopez",
      name: "Roberto López",
      avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    },
  },
];

function ReelThumbnail({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const handleLoadedMetadata = () => {
    if (ref.current) ref.current.currentTime = 0.01;
  };
  return (
    <video
      ref={ref}
      className="reel-card__poster"
      src={src}
      muted
      playsInline
      preload="metadata"
      onLoadedMetadata={handleLoadedMetadata}
    />
  );
}

export default function ProfessionalReelsSection() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<number[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectedReel = selectedIndex !== null ? reels[selectedIndex] : null;

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
      prev === null ? 0 : (prev - 1 + reels.length) % reels.length,
    );
  };

  const showNextReel = () => {
    setSelectedIndex((prev) => (prev === null ? 0 : (prev + 1) % reels.length));
  };

  return (
    <section className="professional-reels">
      <div className="professional-reels__header">
        <h2 className="professional-reels__title">Reels</h2>
        <button className="section-link">View all &gt;</button>
      </div>

      <div className="professional-reels__carousel-wrapper">
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
          {reels.map((reel, index) => (
            <button
              key={reel.id}
              className="reel-card"
              onClick={() => setSelectedIndex(index)}
            >
              <ReelThumbnail src={reel.videoUrl} />
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
                src={selectedReel.videoUrl}
                autoPlay
                loop
                muted
                playsInline
              />

              <div className="reels-modal__topbar reels-modal__topbar--profile">
                <a
                  className="reels-modal__profile-link"
                  href={`/profile/${selectedReel.professional.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <img
                    src={selectedReel.professional.avatar}
                    alt={selectedReel.professional.name}
                    className="reels-modal__profile-avatar"
                  />
                  <span className="reels-modal__profile-name">
                    {selectedReel.professional.name}
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
