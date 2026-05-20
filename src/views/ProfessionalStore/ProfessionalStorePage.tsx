"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Filter,
  X,
  Loader2,
  Package,
  Grid3X3,
  List,
  SlidersHorizontal,
  Globe,
  ArrowLeft,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProfessionalDetailAction } from "../../app/actions/professionals";
import { getProductsAction } from "../../app/actions/products";
import { getProductCategoriesAction } from "../../app/actions/categories";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import "./ProfessionalStorePage.css";

function formatPrice(n: any) {
  return Number(n || 0).toLocaleString("es-AR");
}

const sortOptions = [
  { key: "price-asc", label: "Menor precio" },
  { key: "price-desc", label: "Mayor precio" },
  { key: "relevant", label: "Más relevantes" },
];

const defaultFilters = {
  search: "",
  categoryId: "all",
  priceMin: "",
  priceMax: "",
  ean: "",
  sortBy: "price-asc",
};

export default function ProfessionalStorePage() {
  const params = useParams<{ seoPath: string | string[] }>();
  const seoPathParam = params?.seoPath;
  // [...seoPath] can be ["bodega-sa", "9", "tienda"] in the catch-all route.
  // If the last segment is "tienda", the professional ID is the previous segment.
  const id = Array.isArray(seoPathParam)
    ? seoPathParam[seoPathParam.length - 1] === "tienda"
      ? seoPathParam[seoPathParam.length - 2]
      : seoPathParam[seoPathParam.length - 1]
    : extractIdFromSlug(seoPathParam as string);
  const router = useRouter();

  const [filters, setFilters] = useState(defaultFilters);
  const [debouncedText, setDebouncedText] = useState({ search: "", ean: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedText({ search: filters.search, ean: filters.ean });
    }, 400);
    return () => window.clearTimeout(t);
  }, [filters.search, filters.ean]);

  const { data: professional, isLoading: loadingPro } = useQuery({
    queryKey: ["professional-detail", id],
    queryFn: async () => {
      const result = await getProfessionalDetailAction({ id: id! });
      return result?.data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const result = await getProductCategoriesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["store-products", id, debouncedText, filters, page],
    queryFn: async () => {
      const result = await getProductsAction({
        page,
        limit: 20,
        professionalId: id ? Number(id) : undefined,
        name: debouncedText.search || undefined,
        categoryId:
          filters.categoryId !== "all" ? Number(filters.categoryId) : undefined,
        priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
        ean: debouncedText.ean || undefined,
        sortBy: filters.sortBy,
      });
      return result?.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const normalized = useMemo(() => {
    if (!productsData) return { data: [], count: 0, totalPages: 1 };
    if (Array.isArray(productsData))
      return { data: productsData, count: productsData.length, totalPages: 1 };
    const p = productsData as any;
    return {
      data: Array.isArray(p.data) ? p.data : [],
      count: Number(p.count ?? 0),
      totalPages: Number(p.totalPages ?? 1),
    };
  }, [productsData]);

  const productsList = useMemo(() => {
    return normalized.data.map((item: any) => {
      const images = item.Images || [];
      const sorted = [...images].sort(
        (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0),
      );
      const primaryImage =
        sorted[0]?.image_url ||
        item.image_url ||
        "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";

      const sellers: any[] = item.ProfessionalProducts || [];
      const myEntry = sellers.find(
        (s: any) =>
          String(s.professional_id) === String(id) ||
          String(s.Professional?.id) === String(id),
      );
      const displayPrice = myEntry?.price ?? item.price ?? 0;
      const offerPrice = myEntry?.offer_price;
      const percentDiscount = item.percent_discount || myEntry?.percent_discount || myEntry?.discount_percentage || 0;
      const currencyCode = item.currency_code || myEntry?.currency_code || "ARG";
      const displayDiscount = percentDiscount > 0
        ? percentDiscount
        : (offerPrice && displayPrice ? Math.round((1 - offerPrice / displayPrice) * 100) : 0);
      const sortedSellers = myEntry
        ? [myEntry, ...sellers.filter((s: any) => s !== myEntry)]
        : sellers;

      return {
        id: item.id,
        ean: item.ean,
        title: item.name || "Producto sin nombre",
        description: item.description || "",
        image: primaryImage,
        images: sorted
          .map((i: any) => i.image_url)
          .concat(item.image_url ? [item.image_url] : []),
        price: displayPrice,
        offerPrice,
        discount: displayDiscount,
        currencyCode: currencyCode,
        rating: myEntry?.Professional?.rating_avg || 5,
        sellers: sortedSellers,
        is_foreign: item.is_foreign,
      };
    });
  }, [normalized, id]);

  const profile = professional?.Profile;
  const company = professional?.Companies?.[0] || professional?.Company;
  const storeName =
    company?.name || profile?.display_name || "Tienda Profesional";
  const avatar =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=e94823&color=fff&size=128`;
  const bannerImage =
    profile?.portfolio_image_url || profile?.banner_url || null;

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([k, v]) => v !== defaultFilters[k as keyof typeof defaultFilters],
  ).length;

  if (loadingPro) {
    return (
      <div className="store-loading-screen">
        <Navbar />
        <div className="store-loading-content">
          <Loader2 size={40} className="animate-spin" />
          <p>Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="store-loading-screen">
        <Navbar />
        <div className="store-loading-content">
          <Package size={48} />
          <p>No se encontró el profesional.</p>
          <button onClick={() => router.back()} className="store-back-btn">
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-store">
      <SEO
        title={`Tienda de ${storeName} - Productos y Ofertas`}
        description={`Explorá el catálogo de productos de ${storeName}. Encontrá los mejores precios y ofertas disponibles.`}
        image={avatar}
      />
      <Navbar />

      {/* BANNER */}
      <header
        className="store-banner"
        style={
          bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined
        }
      >
        <div className="store-banner__overlay" />
        <div className="store-banner__content">
          <button
            className="store-banner__back"
            onClick={() =>
              router.push(getProfilePath(id!, professional?.seo_path))
            }
          >
            <ArrowLeft size={16} /> Volver al perfil
          </button>
          <div className="store-banner__identity">
            <div className="store-banner__avatar-wrap">
              <img
                src={avatar}
                alt={storeName}
                className="store-banner__avatar"
              />
            </div>
            <div className="store-banner__text">
              <div className="store-banner__badge">
                <ShoppingBag size={13} /> Tienda Oficial
              </div>
              <h1 className="store-banner__name">{storeName}</h1>
              <p className="store-banner__meta">
                {normalized.count} producto{normalized.count !== 1 ? "s" : ""}{" "}
                disponibles
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="store-main">
        {/* Toolbar */}
        <div className="store-toolbar">
          <div className="store-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
          <div className="store-toolbar__right">
            <div className="store-sort">
              <SlidersHorizontal size={15} />
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="store-view-toggle">
              <button
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
              </button>
            </div>
            <button
              className={`store-filter-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} /> Filtros
              {activeFiltersCount > 0 && (
                <span className="store-filter-badge">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="store-layout">
          {/* Sidebar */}
          <aside className={`store-sidebar ${showFilters ? "open" : ""}`}>
            <div className="store-sidebar__header">
              <h3>Filtros</h3>
              <button onClick={() => setShowFilters(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="store-filter-section">
              <label>
                <Package size={14} /> Categoría
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) =>
                  handleFilterChange("categoryId", e.target.value)
                }
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="store-filter-section">
              <label>
                <SlidersHorizontal size={14} /> Precio
              </label>
              <div className="store-filter-range">
                <input
                  type="number"
                  min="0"
                  placeholder="Mín"
                  value={filters.priceMin}
                  onChange={(e) =>
                    handleFilterChange("priceMin", e.target.value)
                  }
                  className="store-filter-input"
                />
                <span>—</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Máx"
                  value={filters.priceMax}
                  onChange={(e) =>
                    handleFilterChange("priceMax", e.target.value)
                  }
                  className="store-filter-input"
                />
              </div>
            </div>

            <div className="store-filter-section">
              <label>EAN / Código</label>
              <input
                type="text"
                placeholder="Ej: 7791234567890"
                value={filters.ean}
                onChange={(e) =>
                  handleFilterChange("ean", e.target.value.replace(/\D/g, ""))
                }
                inputMode="numeric"
                className="store-filter-input"
              />
            </div>

            <button className="store-clear-btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </aside>

          {/* Products */}
          <section className="store-results">
            <p className="store-count">
              {loadingProducts
                ? "Buscando..."
                : `${normalized.count} producto${normalized.count !== 1 ? "s" : ""}`}
            </p>

            {loadingProducts ? (
              <div className="store-spinner">
                <Loader2 size={36} className="animate-spin" />
                <p>Cargando productos...</p>
              </div>
            ) : productsList.length === 0 ? (
              <div className="store-empty">
                <Package size={52} />
                <h3>Sin productos disponibles</h3>
                <p>Intentá ajustar los filtros o buscá otro término.</p>
                <button className="store-clear-btn" onClick={clearFilters}>
                  Ver todos
                </button>
              </div>
            ) : (
              <div
                className={`store-grid ${viewMode === "list" ? "store-grid--list" : ""}`}
              >
                {productsList.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`store-product-card ${viewMode === "list" ? "store-product-card--list" : ""}`}
                    onClick={() => {
                      const slug = product.title
                        ? product.title
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                        : `product-${product.id}`;
                      router.push(`/productos/${slug}?id=${product.id}`);
                    }}
                  >
                    <div className="store-product-card__image">
                      <img src={product.image} alt={product.title} />
                      {product.is_foreign && (
                        <span className="store-badge store-badge--foreign">
                          <Globe size={10} /> EXTERNO
                        </span>
                      )}
                      {product.discount > 0 && (
                        <span className="store-badge store-badge--discount">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <div className="store-product-card__body">
                      <h3 className="store-product-card__title">
                        {product.title}
                      </h3>
                      <div className="store-product-card__pricing">
                        {product.offerPrice ? (
                          <>
                            <span className="store-price--original">
                              {product.currencyCode === "USD" ? "USD $" : "$"}{formatPrice(product.price)}
                            </span>
                            <div className="store-price--row">
                              <span className="store-price--main">
                                {product.currencyCode === "USD" ? "USD $" : "$"}{formatPrice(product.offerPrice)}
                              </span>
                              {product.discount > 0 && (
                                <span className="store-price--off">
                                  {product.discount}% OFF
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="store-price--row">
                            <span className="store-price--main">
                              {product.currencyCode === "USD" ? "USD $" : "$"}{formatPrice(product.price)}
                            </span>
                          </div>
                        )}
                      </div>
                      {viewMode === "list" && product.description && (
                        <p className="store-product-card__desc">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loadingProducts && normalized.totalPages > 1 && (
              <div className="store-pagination">
                <button
                  className="store-pagination__btn"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="store-pagination__info">
                  Página {page} de {normalized.totalPages}
                </span>
                <button
                  className="store-pagination__btn"
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, normalized.totalPages))
                  }
                  disabled={page >= normalized.totalPages}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
