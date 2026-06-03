import "./Pagination.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPage?: (page: number) => void;
  className?: string;
}

export default function Pagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onPage,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page window: show at most 5 page numbers
  const getPageNumbers = () => {
    const range: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  };

  return (
    <nav className={`pagination ${className}`} aria-label="Paginación">
      <button
        className="pagination__btn pagination__btn--prev"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Página anterior"
      >
        ‹
      </button>

      {onPage && getPageNumbers().map((p) => (
        <button
          key={p}
          className={`pagination__btn pagination__btn--page ${p === page ? "pagination__btn--active" : ""}`}
          onClick={() => onPage(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      {!onPage && (
        <span className="pagination__info">
          {page} / {totalPages}
        </span>
      )}

      <button
        className="pagination__btn pagination__btn--next"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </nav>
  );
}
