import { useCallback, useEffect, useRef, useState } from "react";

export default function useCarouselDrag(
  sliderRef,
  cardSelector = ".carousel-card",
) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const isDragging = useRef(false);
  const pointerIdRef = useRef(null);
  const hasPointerCapture = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);

  const updateArrowVisibility = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
    setShowLeftArrow(slider.scrollLeft > 10);
    setShowRightArrow(slider.scrollLeft < maxScrollLeft - 10);
  }, [sliderRef]);

  const scrollCarousel = useCallback(
    (direction) => {
      const slider = sliderRef.current;
      if (!slider) return;

      const card = slider.querySelector(cardSelector);
      const cardWidth = card?.offsetWidth ?? 260;
      const gap = 16;

      slider.scrollBy({
        left: direction * (cardWidth + gap),
        behavior: "smooth",
      });
    },
    [sliderRef, cardSelector],
  );

  const handlePointerDown = useCallback(
    (event) => {
      const slider = sliderRef.current;
      if (!slider || event.button !== 0) return;

      isDragging.current = false;
      pointerIdRef.current = event.pointerId;
      startX.current = event.clientX - slider.offsetLeft;
      startY.current = event.clientY - slider.offsetTop;
      scrollLeft.current = slider.scrollLeft;
    },
    [sliderRef],
  );

  const handlePointerMove = useCallback(
    (event) => {
      const slider = sliderRef.current;
      if (!slider) return;

      const x = event.clientX - slider.offsetLeft;
      const y = event.clientY - slider.offsetTop;
      const walk = x - startX.current;
      const vertical = y - startY.current;

      if (
        !isDragging.current &&
        Math.abs(walk) > 10 &&
        Math.abs(walk) > Math.abs(vertical)
      ) {
        isDragging.current = true;
        slider.classList.add("is-dragging");
        if (pointerIdRef.current != null && !hasPointerCapture.current) {
          slider.setPointerCapture(pointerIdRef.current);
          hasPointerCapture.current = true;
        }
      }

      if (!isDragging.current) return;

      event.preventDefault();
      slider.scrollLeft = scrollLeft.current - walk * 1.5;
    },
    [sliderRef],
  );

  const handlePointerUp = useCallback(
    (event) => {
      const slider = sliderRef.current;
      if (!slider) return;

      isDragging.current = false;
      slider.classList.remove("is-dragging");
      if (hasPointerCapture.current && pointerIdRef.current != null) {
        slider.releasePointerCapture(pointerIdRef.current);
        hasPointerCapture.current = false;
      }
      pointerIdRef.current = null;
    },
    [sliderRef],
  );

  useEffect(() => {
    updateArrowVisibility();
    window.addEventListener("resize", updateArrowVisibility);

    return () => {
      window.removeEventListener("resize", updateArrowVisibility);
    };
  }, [updateArrowVisibility]);

  return {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  };
}
