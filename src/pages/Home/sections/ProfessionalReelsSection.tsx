import { useRef, useState } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./ProfessionalReelsSection.css";

const reels = [
  { id: 1, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { id: 2, videoUrl: "https://www.w3schools.com/html/movie.mp4" },
  { id: 3, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { id: 4, videoUrl: "https://www.w3schools.com/html/movie.mp4" },
  { id: 5, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
];

function ReelThumbnail({ src }) {
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
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".reel-card");

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
          {reels.map((reel) => (
            <button
              key={reel.id}
              className="reel-card"
              onClick={() => setSelectedReel(reel)}
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
        <div className="reels-modal-overlay" onClick={() => setSelectedReel(null)}>
          <div className="reels-modal" onClick={e => e.stopPropagation()}>
             <video 
                src={selectedReel.videoUrl} 
                autoPlay 
                controls 
                style={{ height: '80vh', borderRadius: '12px' }} 
              />
          </div>
        </div>
      )}
    </section>
  );
}
