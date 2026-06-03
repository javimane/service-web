"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { searchAction } from "../../app/actions/search";
import "./SearchBar.css";

type SearchItem = {
  id: string | number;
  name: string;
  description: string | null;
  type: "service" | "product" | "professional" | "bank_promotion" | "promotion";
  seo_path: string;
  image_url: string | null;
};

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  professional: "Profesional",
  service: "Servicio",
  product: "Producto",
  bank_promotion: "Promo bancaria",
  promotion: "Promoción",
};

const TYPE_ICONS: Record<SearchItem["type"], string> = {
  professional: "👤",
  service: "🔧",
  product: "📦",
  bank_promotion: "🏦",
  promotion: "🎫",
};

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await searchAction({ q: q.trim(), limit: 5 });
      const data = (res?.data as any) ?? res;
      const flat: SearchItem[] = data?.results ?? [];
      setResults(flat.slice(0, 8));
      setIsOpen(flat.length > 0);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setIsOpen(false);
    router.push(`/busqueda?q=${encodeURIComponent(q)}`);
  };

  const handleSelectItem = (item: SearchItem) => {
    setIsOpen(false);
    setQuery(item.name);
    // Navigate to the item's seo_path or a generic busqueda page
    const path = item.seo_path.startsWith("/")
      ? item.seo_path
      : `/${item.seo_path}`;
    router.push(path);
  };

  return (
    <div className="search-bar-wrapper" ref={containerRef}>
      <form className="search-bar" onSubmit={handleSubmit} role="search">
        <span className="search-bar__icon-left">
          {isLoading ? (
            <Loader2 size={15} className="search-bar__spinner" />
          ) : (
            <Search size={15} />
          )}
        </span>
        <input
          className="search-bar__input"
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Busca servicios, profesionales..."
          aria-label="Buscar en Sercio"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          autoComplete="off"
        />
        <button className="search-bar__btn" type="submit">
          Buscar
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown" role="listbox">
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              className="search-dropdown__item"
              onClick={() => handleSelectItem(item)}
              role="option"
              type="button"
            >
              <span className="search-dropdown__type-icon">
                {TYPE_ICONS[item.type]}
              </span>
              <span className="search-dropdown__info">
                <span className="search-dropdown__name">{item.name}</span>
                {item.description && (
                  <span className="search-dropdown__desc">
                    {item.description.slice(0, 60)}
                    {item.description.length > 60 ? "…" : ""}
                  </span>
                )}
              </span>
              <span className="search-dropdown__type-label">
                {TYPE_LABELS[item.type]}
              </span>
            </button>
          ))}
          <button
            className="search-dropdown__view-all"
            onClick={handleSubmit as any}
            type="button"
          >
            Ver todos los resultados para "{query}"
          </button>
        </div>
      )}
    </div>
  );
}
