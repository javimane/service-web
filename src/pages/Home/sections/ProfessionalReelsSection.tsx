import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
} from "lucide-react";
import "./ProfessionalReelsSection.css";

const reels = [
  {
    id: 1,
    title: "Video corporativo express",
    creator: "Ana Pérez",
    avatar: "https://i.pravatar.cc/150?u=ana",
    duration: "0:28",
    description: "Historias visuales para atraer clientes en segundos.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 2400,
    views: "18K",
  },
  {
    id: 2,
    title: "Boceto y resultado final",
    creator: "Marcelo G.",
    avatar: "https://i.pravatar.cc/150?u=marcelo",
    duration: "0:24",
    description: "Del concepto al acabado profesional en un reel.",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    likes: 5100,
    views: "33K",
  },
  {
    id: 3,
    title: "Presencia digital premium",
    creator: "Luna Studio",
    avatar: "https://i.pravatar.cc/150?u=luna",
    duration: "0:30",
    description: "Una presentación rápida que vende y enamora.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 8900,
    views: "61K",
  },
  {
    id: 4,
    title: "Marca personal en 30 seg",
    creator: "Carlos Fonts",
    avatar: "https://i.pravatar.cc/150?u=carlos",
    duration: "0:30",
    description: "Tu historia, tu marca, tu momento.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 3700,
    views: "22K",
  },
  {
    id: 5,
    title: "Identidad visual impactante",
    creator: "Sofía Redondo",
    avatar: "https://i.pravatar.cc/150?u=sofia",
    duration: "0:26",
    description: "Diseño que convierte visitas en clientes.",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    likes: 1200,
    views: "9.8K",
  },
];

/** Formats a like count: 1234 → "1.2K" */
function formatLikes(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

/** Card thumbnail: a muted video element that shows the first frame */
function ReelThumbnail({ src }) {
  const ref = useRef(null);

  const handleLoadedMetadata = () => {
    const v = ref.current;
    if (v) v.currentTime = 0.01;
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
      draggable="false"
    />
  );
}

export default function ProfessionalReelsSection() {
  const [selectedReel, setSelectedReel] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [likedReels, setLikedReels] = useState({});
  const [likeCounts, setLikeCounts] = useState(
    Object.fromEntries(reels.map((r) => [r.id, r.likes]))
  );
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const sliderRef = useRef(null);
  const modalVideoRef = useRef(null);

  const currentIndex = selectedReel
    ? reels.findIndex((r) => r.id === selectedReel.id)
    : -1;

  useEffect(() => {
    updateArrowVisibility();
  }, []);

  useEffect(() => {
    const video = modalVideoRef.current;
    if (!selectedReel || !video) return;
    video.currentTime = 0;
    video.muted = false;
    video.play().catch(() => {});
    setIsPaused(false);
    setIsMuted(false);
  }, [selectedReel]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedReel) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedReel]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedReel ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedReel]);

  const updateArrowVisibility = () => {
    const slider = sliderRef.current;
    if (!slider) return;
    const max = slider.scrollWidth - slider.clientWidth;
    setShowLeftArrow(slider.scrollLeft > 10);
    setShowRightArrow(slider.scrollLeft < max - 10);
  };

  const scrollCarousel = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const card = slider.querySelector(".reel-card");
    const cardWidth = card?.offsetWidth ?? 200;
    slider.scrollBy({ left: direction * (cardWidth + 12), behavior: "smooth" });
  };

  const handleClose = () => {
    const video = modalVideoRef.current;
    if (video) video.pause();
    setSelectedReel(null);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setSelectedReel(reels[currentIndex - 1]);
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) setSelectedReel(reels[currentIndex + 1]);
  };

  const handlePlayPause = () => {
    const video = modalVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const handleMuteToggle = () => {
    const video = modalVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleRestart = () => {
    const video = modalVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setIsPaused(false);
  };

  const handleLike = (e, reelId) => {
    e.stopPropagation();
    setLikedReels((prev) => {
      const nowLiked = !prev[reelId];
      setLikeCounts((counts) => ({
        ...counts,
        [reelId]: counts[reelId] + (nowLiked ? 1 : -1),
      }));
      return { ...prev, [reelId]: nowLiked };
    });
  };

  return (
    <section className="professional-reels">
      <div className="professional-reels__header">
        <div>
          <span className="section-label">Reels Profesionales</span>
          <h2 className="professional-reels__title">
            Videos cortos listos para destacar tu servicio
          </h2>
        </div>
        <button className="section-link">Descubre más</button>
      </div>

      <div className="professional-reels__carousel">
        <button
          className={`carousel-control carousel-control--left${showLeftArrow ? "" : " carousel-control--hidden"}`}
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
        >
          {reels.map((reel) => (
            <button
              key={reel.id}
              type="button"
              className="reel-card"
              onClick={() => setSelectedReel(reel)}
              aria-label={`Ver reel: ${reel.title}`}
            >
              {/* First-frame video thumbnail */}
              <ReelThumbnail src={reel.videoUrl} />

              {/* Gradient overlay */}
              <div className="reel-card__overlay" />

              {/* Play icon */}
              <div className="reel-card__play-btn">
                <Play size={22} fill="white" />
              </div>

              {/* Duration badge */}
              <span className="reel-card__duration">{reel.duration}</span>

              {/* Bottom info */}
              <div className="reel-card__info">
                <div className="reel-card__author">
                  <img
                    src={reel.avatar}
                    alt={reel.creator}
                    className="reel-card__avatar"
                  />
                  <span className="reel-card__creator">{reel.creator}</span>
                </div>
                <h3 className="reel-card__title">{reel.title}</h3>
                <div className="reel-card__stats">
                  <span>▶ {reel.views}</span>
                  <span
                    className={`reel-card__like-badge${likedReels[reel.id] ? " reel-card__like-badge--active" : ""}`}
                    onClick={(e) => handleLike(e, reel.id)}
                    role="button"
                    tabIndex={-1}
                    aria-label="Me gusta"
                  >
                    <ThumbsUp size={11} />
                    {formatLikes(likeCounts[reel.id])}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          className={`carousel-control carousel-control--right${showRightArrow ? "" : " carousel-control--hidden"}`}
          type="button"
          onClick={() => scrollCarousel(1)}
          aria-label="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {selectedReel && (
        <div
          className="reels-modal-overlay"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={selectedReel.title}
        >
          <div
            className="reels-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Row: [ ◀ ] [ video ] [ ▶ ] ─────────────────────── */}
            <div className="reels-modal__row">
              {/* Prev button — left of video */}
              <button
                className="reels-modal__side-nav"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                aria-label="Video anterior"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Video wrap */}
              <div className="reels-modal__video-wrap">
                <video
                  ref={modalVideoRef}
                  className="reels-modal__video"
                  src={selectedReel.videoUrl}
                  playsInline
                  autoPlay
                  loop
                />


              {/* Top bar */}
              <div className="reels-modal__topbar">
                <div className="reels-modal__author">
                  <img
                    src={selectedReel.avatar}
                    alt={selectedReel.creator}
                    className="reels-modal__avatar"
                  />
                  <div>
                    <p className="reels-modal__creator">{selectedReel.creator}</p>
                    <p className="reels-modal__subtitle">{selectedReel.title}</p>
                  </div>
                </div>
                <button
                  className="reels-modal__close"
                  onClick={handleClose}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Right-side controls */}
              <div className="reels-modal__controls">
                <button
                  className="reels-modal__ctrl-btn"
                  onClick={handlePlayPause}
                  aria-label={isPaused ? "Reproducir" : "Pausar"}
                >
                  {isPaused ? <Play size={20} fill="white" /> : <Pause size={20} fill="white" />}
                </button>
                <button
                  className="reels-modal__ctrl-btn"
                  onClick={handleRestart}
                  aria-label="Reiniciar"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  className="reels-modal__ctrl-btn"
                  onClick={handleMuteToggle}
                  aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                {/* Like button */}
                <div className="reels-modal__like-wrap">
                  <button
                    className={`reels-modal__ctrl-btn reels-modal__like-btn${likedReels[selectedReel.id] ? " reels-modal__like-btn--active" : ""}`}
                    onClick={(e) => handleLike(e, selectedReel.id)}
                    aria-label="Me gusta"
                  >
                    <ThumbsUp size={20} />
                  </button>
                  <span className="reels-modal__like-count">
                    {formatLikes(likeCounts[selectedReel.id])}
                  </span>
                </div>
              </div>

              {/* Bottom description */}
              <div className="reels-modal__desc">
                <p>{selectedReel.description}</p>
                <div className="reels-modal__meta">
                  <span>▶ {selectedReel.views} vistas</span>
                  <span>⏱ {selectedReel.duration}</span>
                </div>
              </div>
              </div>

              {/* Next button — right of video */}
              <button
                className="reels-modal__side-nav"
                onClick={handleNext}
                disabled={currentIndex === reels.length - 1}
                aria-label="Siguiente video"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Dot indicator */}
            <div className="reels-modal__dots">
              {reels.map((r, i) => (
                <button
                  key={r.id}
                  className={`reels-modal__dot${i === currentIndex ? " reels-modal__dot--active" : ""}`}
                  onClick={() => setSelectedReel(r)}
                  aria-label={`Ir al reel ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
