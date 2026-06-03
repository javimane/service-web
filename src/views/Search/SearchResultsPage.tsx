"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, User, Wrench, Package, Ticket, Landmark } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { searchAction } from "../../app/actions/search";
import "./SearchResultsPage.css";

type SearchItem = {
  id: string | number;
  name: string;
  description: string | null;
  type: "service" | "product" | "professional" | "bank_promotion" | "promotion";
  seo_path: string;
  image_url: string | null;
  price?: number | null;
  discount?: number | null;
  subscriptionPlan?: string | null;
  metadata?: Record<string, any>;
};

type SearchResponse = {
  results: SearchItem[];
  grouped: {
    services: SearchItem[];
    products: SearchItem[];
    professionals: SearchItem[];
    bankPromotions: SearchItem[];
    promotions: SearchItem[];
  };
};

const SECTION_CONFIG = [
  {
    key: "professionals" as const,
    label: "Profesionales",
    Icon: User,
    color: "var(--brand-blue)",
  },
  {
    key: "services" as const,
    label: "Servicios",
    Icon: Wrench,
    color: "var(--accent-color)",
  },
  {
    key: "products" as const,
    label: "Productos",
    Icon: Package,
    color: "#7c3aed",
  },
  {
    key: "promotions" as const,
    label: "Promociones",
    Icon: Ticket,
    color: "#d97706",
  },
  {
    key: "bankPromotions" as const,
    label: "Promociones Bancarias",
    Icon: Landmark,
    color: "#059669",
  },
];

function ResultCard({ item }: { item: SearchItem }) {
  const router = useRouter();

  const handleClick = () => {
    const path = item.seo_path.startsWith("/") ? item.seo_path : `/${item.seo_path}`;
    router.push(path);
  };

  return (
    <button className="search-result-card" onClick={handleClick} type="button">
      {item.image_url ? (
        <img
          className="search-result-card__image"
          src={item.image_url}
          alt={item.name}
        />
      ) : (
        <div className="search-result-card__image search-result-card__image--placeholder">
          {item.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="search-result-card__body">
        <p className="search-result-card__name">{item.name}</p>
        {item.description && (
          <p className="search-result-card__desc">
            {item.description.slice(0, 80)}
            {item.description.length > 80 ? "…" : ""}
          </p>
        )}
        <div className="search-result-card__meta">
          {item.price != null && (
            <span className="search-result-card__price">
              ${item.price.toLocaleString("es-AR")}
            </span>
          )}
          {item.discount != null && (
            <span className="search-result-card__discount">
              {item.discount}% OFF
            </span>
          )}
          {item.metadata?.professional_name && (
            <span className="search-result-card__company">
              {item.metadata.professional_name}
            </span>
          )}
          {item.subscriptionPlan === "premium" && (
            <span className="search-result-card__premium">⭐ Premium</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams?.get("q") ?? "";
  const [inputValue, setInputValue] = useState(q);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await searchAction({ q: query.trim(), limit: 20 });
      const raw = (res?.data as any) ?? res;
      setData(raw as SearchResponse);
    } catch (e: any) {
      setError("Hubo un error al buscar. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setInputValue(q);
    if (q) doSearch(q);
  }, [q, doSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    router.push(`/busqueda?q=${encodeURIComponent(trimmed)}`);
  };

  const totalResults = data?.results.length ?? 0;

  return (
    <>
      <Navbar />
      <main className="search-results-page">
        {/* Search hero */}
        <section className="search-results-hero">
          <div className="search-results-hero__inner">
            <h1 className="search-results-hero__title">
              {q ? (
                <>
                  Resultados para{" "}
                  <span className="search-results-hero__query">"{q}"</span>
                </>
              ) : (
                "Buscar en Sercio"
              )}
            </h1>
            <form
              className="search-results-hero__form"
              onSubmit={handleFormSubmit}
            >
              <div className="search-results-hero__input-wrap">
                <Search size={18} className="search-results-hero__icon" />
                <input
                  className="search-results-hero__input"
                  type="search"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Busca servicios, profesionales, productos..."
                  aria-label="Nueva búsqueda"
                />
              </div>
              <button
                className="search-results-hero__btn"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={16} className="spin-icon" /> : "Buscar"}
              </button>
            </form>
            {!isLoading && data && (
              <p className="search-results-hero__count">
                {totalResults === 0
                  ? "No se encontraron resultados"
                  : `${totalResults} resultado${totalResults !== 1 ? "s" : ""} encontrado${totalResults !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="search-results-content">
          <div className="search-results-content__inner">
            {isLoading && (
              <div className="search-results-loading">
                <Loader2 size={48} className="spin-icon" />
                <p>Buscando resultados...</p>
              </div>
            )}

            {error && (
              <div className="search-results-error">
                <p>{error}</p>
              </div>
            )}

            {!isLoading && !error && data && totalResults === 0 && (
              <div className="search-results-empty">
                <Search size={64} strokeWidth={1} />
                <h2>Sin resultados para "{q}"</h2>
                <p>
                  Probá con otro término de búsqueda, revisá la ortografía, o
                  intentá con palabras más generales.
                </p>
              </div>
            )}

            {!isLoading && data && totalResults > 0 && (
              <div className="search-results-sections">
                {SECTION_CONFIG.map(({ key, label, Icon, color }) => {
                  const items = data.grouped[key];
                  if (!items?.length) return null;
                  return (
                    <section key={key} className="search-results-section">
                      <div className="search-results-section__header">
                        <span
                          className="search-results-section__icon"
                          style={{ color }}
                        >
                          <Icon size={20} />
                        </span>
                        <h2 className="search-results-section__title">
                          {label}
                        </h2>
                        <span className="search-results-section__count">
                          {items.length}
                        </span>
                      </div>
                      <div className="search-results-section__grid">
                        {items.map((item) => (
                          <ResultCard key={`${item.type}-${item.id}`} item={item} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
