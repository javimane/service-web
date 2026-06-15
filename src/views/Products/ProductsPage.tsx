"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Globe,
  Filter,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProductsAction } from "../../app/actions/products";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import ProductFilters from "./ProductFilters";
import "./ProductsPage.css";
import { getProductCategoriesAction } from "@/app/actions/categories";
import { getProvincesAction } from "@/app/actions/provinces";

function formatPrice(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

const sortOptions = [
  { key: "relevant", label: "Más relevantes" },
  { key: "price-asc", label: "Menor precio" },
  { key: "price-desc", label: "Mayor precio" },
];

const defaultFilters = {
  search: "",
  categoryId: "all",
  provinceId: "all",
  is_foreign: "all", // "all", "national", "foreign"
  price: "",
  priceMin: "",
  priceMax: "",
  brand: "",
  ean: "",
  wholesale: "all",
  limit: "10",
  sortBy: "price-asc",
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const professionalIdParam = searchParams?.get("professionalId") ?? null;

  const [filters, setFilters] = useState(defaultFilters);
  const [debouncedTextFilters, setDebouncedTextFilters] = useState({
    search: defaultFilters.search,
    brand: defaultFilters.brand,
    ean: defaultFilters.ean,
  });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce only for brand and ean (not search)
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTextFilters((prev) => ({
        ...prev,
        brand: filters.brand,
        ean: filters.ean,
      }));
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [filters.brand, filters.ean]);

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      ...debouncedTextFilters,
    }),
    [filters, debouncedTextFilters],
  );

  // Data fetching
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const result = await getProductCategoriesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", effectiveFilters, page],
    queryFn: async () => {
      const params = {
        page,
        limit: Number(effectiveFilters.limit),
        name: effectiveFilters.search || undefined,
        sortBy: effectiveFilters.sortBy || undefined,
        categoryId:
          effectiveFilters.categoryId === "all"
            ? undefined
            : Number(effectiveFilters.categoryId),
        provinceId:
          effectiveFilters.provinceId === "all"
            ? undefined
            : Number(effectiveFilters.provinceId),
        price:
          effectiveFilters.price === ""
            ? undefined
            : Number(effectiveFilters.price),
        priceMin: effectiveFilters.price
          ? undefined
          : effectiveFilters.priceMin === ""
            ? undefined
            : Number(effectiveFilters.priceMin),
        priceMax: effectiveFilters.price
          ? undefined
          : effectiveFilters.priceMax === ""
            ? undefined
            : Number(effectiveFilters.priceMax),
        brand: effectiveFilters.brand || undefined,
        ean: effectiveFilters.ean || undefined,
        is_foreign:
          effectiveFilters.is_foreign === "all"
            ? undefined
            : effectiveFilters.is_foreign === "external",
        wholesale:
          effectiveFilters.wholesale === "true" ? true : undefined,
      };
      const result = await getProductsAction(params);
      return result?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const normalizedProductsResponse = useMemo(() => {
    if (Array.isArray(productsData)) {
      return {
        data: productsData,
        count: productsData.length,
        page: 1,
        limit: productsData.length || Number(filters.limit),
        totalPages: 1,
      };
    }

    if (productsData && Array.isArray((productsData as any).data)) {
      const paginatedData = productsData as any;
      return {
        data: paginatedData.data,
        count: Number(paginatedData.count ?? paginatedData.data.length),
        page: Number(paginatedData.page ?? page),
        limit: Number(paginatedData.limit ?? filters.limit),
        totalPages: Number(paginatedData.totalPages ?? 1),
      };
    }

    return {
      data: [],
      count: 0,
      page,
      limit: Number(filters.limit),
      totalPages: 1,
    };
  }, [productsData, page, filters.limit]);

  const productsList = useMemo(() => {
    if (!normalizedProductsResponse.data.length) return [];
    const professionalId = professionalIdParam
      ? Number(professionalIdParam)
      : null;
    const professionalFilteredProducts = normalizedProductsResponse.data.filter(
      (item: any) => {
        if (!professionalId) return true;
        const sellers = Array.isArray(item?.ProfessionalProducts)
          ? item.ProfessionalProducts
          : [];
        return sellers.some(
          (seller: any) => Number(seller?.professional_id) === professionalId,
        );
      },
    );

    return professionalFilteredProducts.map((item: any) => {
      const product = item;
      const images = product?.Images || [];
      const sortedImages = [...images].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0),
      );
      const primaryImage =
        sortedImages[0]?.image_url ||
        product?.image_url ||
        "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";

      const sellers = product.ProfessionalProducts || [];
      const firstSeller = sellers[0] || {};

      const displayPrice = product.price || firstSeller.price || 0;
      const displayDiscount =
        product.percent_discount ||
        firstSeller.percent_discount ||
        firstSeller.discount_percentage ||
        0;
      const displayOriginalPrice = firstSeller.original_price;
      const currencyCode =
        product.currency_code || firstSeller.currency_code || "ARG";

      // Extract company name handling array structure
      const companyData = firstSeller.Professional?.Company;
      const sellerName = Array.isArray(companyData)
        ? companyData[0]?.name
        : companyData?.name || "Varios vendedores";

      return {
        id: product.id,
        productId: product.id,
        ean: product.ean,
        images: sortedImages
          .map((img) => img.image_url)
          .concat(product?.image_url ? [product.image_url] : []),
        title: product.name || "Producto sin nombre",
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        discount: displayDiscount,
        currencyCode: currencyCode,
        seller:
          sellers.length > 1
            ? `Varios vendedores (${sellers.length})`
            : sellerName,
        image: primaryImage,
        rating: firstSeller.Professional?.rating_avg || 5,
        reviews: 0,
        freeShipping: false,
        description: product.description || "",
        is_foreign: product.is_foreign,
        wholesale: firstSeller.wholesale,
        wholesale_price: firstSeller.wholesale_price,
        wholesale_unit: firstSeller.wholesale_unit,
        sellers: sellers,
        _original: item,
      };
    });
  }, [normalizedProductsResponse, professionalIdParam]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (!normalizedProductsResponse.totalPages) return;
    setPage(
      Math.min(Math.max(nextPage, 1), normalizedProductsResponse.totalPages),
    );
  };

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([key, value]) =>
          value !== defaultFilters[key as keyof typeof defaultFilters],
      ).length,
    [filters],
  );

  const isDebouncingTextFilters =
    filters.brand !== debouncedTextFilters.brand ||
    filters.ean !== debouncedTextFilters.ean;

  // Suggestions: match product names from already-loaded data
  const suggestions = useMemo(() => {
    if (!searchInput.trim() || searchInput.length < 2) return [];
    const term = searchInput.toLowerCase();
    const names: string[] = [];
    const seen = new Set<string>();
    (productsList || []).forEach((p: any) => {
      const name: string = p.title || "";
      if (name.toLowerCase().includes(term) && !seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    });
    return names.slice(0, 6);
  }, [searchInput, productsList]);

  const commitSearch = (value: string) => {
    const trimmed = value.trim();
    setFilters((prev) => ({ ...prev, search: trimmed }));
    setDebouncedTextFilters((prev) => ({ ...prev, search: trimmed }));
    setPage(1);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({ ...defaultFilters });
    setPage(1);
  };

  const currentCategoryName = useMemo(() => {
    if (filters.categoryId === "all") return null;
    const cat = categories.find(
      (c: any) => String(c.id) === String(filters.categoryId),
    );
    return cat ? cat.name : null;
  }, [categories, filters.categoryId]);

  return (
    <div className="products-page">
      <SEO
        title={
          currentCategoryName
            ? `${currentCategoryName} - Catálogo de Productos`
            : "Catálogo de Productos - Encontrá lo mejor"
        }
        description={
          currentCategoryName
            ? `Explorá nuestra selección de ${currentCategoryName}. Los mejores precios y calidad en un solo lugar.`
            : "Explorá nuestro catálogo completo de productos profesionales. Filtros por categoría, precio y ubicación."
        }
      />
      <Navbar />

      <main className="products-page__main">
        {/* Header */}
        <div className="products-page__header">
          <div className="products-page__header-top">
            <div>
              <h1 className="products-page__title">Catálogo de Productos</h1>
              <p className="products-page__subtitle">
                {isDebouncingTextFilters
                  ? "Buscando..."
                  : isLoading
                    ? "Cargando..."
                    : `${normalizedProductsResponse.count} productos encontrados`}
              </p>
            </div>

            <div className="products-page__view-toggle">
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Vista cuadrícula"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="Vista lista"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="products-page__search-wrapper" ref={searchRef}>
            <div className="products-page__search">
              <Search size={18} />
              <input
                type="text"
                placeholder="¿Qué estás buscando hoy?"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitSearch(searchInput);
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
                onFocus={() =>
                  searchInput.length >= 2 && setShowSuggestions(true)
                }
              />
              {filters.search && (
                <button
                  className="products-page__search-clear"
                  onClick={() => {
                    setSearchInput("");
                    commitSearch("");
                  }}
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
              {isDebouncingTextFilters && (
                <span
                  className="products-page__search-status"
                  aria-live="polite"
                >
                  <Loader2 size={14} className="animate-spin" />
                  Buscando...
                </span>
              )}
            </div>
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="products-page__suggestions">
                {suggestions.map((s) => (
                  <li
                    key={s}
                    className="products-page__suggestion-item"
                    onMouseDown={() => {
                      setSearchInput(s);
                      commitSearch(s);
                    }}
                  >
                    <Search size={13} />
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <button
              className={`products-page__filter-toggle ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filtros
              {activeFiltersCount > 0 && <span className="filter-badge" />}
            </button>
          </div>
        </div>

        <section className="products-page__content">
          <ProductFilters
            filters={filters}
            categories={categories}
            provinces={provinces}
            onFilterChange={handleFilterChange}
            onClear={clearFilters}
            showFilters={showFilters}
            onToggle={setShowFilters}
            professionalIdParam={professionalIdParam}
            searchParams={searchParams}
            pathname={pathname}
            router={router}
          />

          <div className="products-results">
            {/* Header controls inside results for better flow */}
            <div className="results-header">
              <div className="results-header__info">
                <p>
                  {isLoading
                    ? "Buscando..."
                    : `${normalizedProductsResponse.count} productos encontrados`}
                </p>
              </div>
              <div className="results-header__controls">
                <div className="products-page__sort">
                  <SlidersHorizontal size={16} />
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="products-page__view-toggle">
                  <button
                    type="button"
                    className={viewMode === "grid" ? "active" : ""}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "list" ? "active" : ""}
                    onClick={() => setViewMode("list")}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div
              className={`products-page__grid ${viewMode === "list" ? "products-page__grid--list" : ""}`}
            >
              {isLoading ? (
                <div className="products-page__loading">
                  <Loader2 className="animate-spin" size={32} />
                  <p>Cargando productos...</p>
                </div>
              ) : (
                productsList.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`product-card ${viewMode === "list" ? "product-card--list" : ""}`}
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
                    <div className="product-card__image">
                      <img src={product.image} alt={product.title} />
                      {product.is_foreign && (
                        <span className="product-card__badge-foreign">
                          <Globe size={10} /> EXTERNO
                        </span>
                      )}
                      {product.discount > 0 && (
                        <span className="product-card__badge-discount">
                          -{product.discount}%
                        </span>
                      )}
                    </div>

                    <div className="product-card__body">
                      <span className="product-card__seller">
                        {product.seller}
                      </span>
                      <h3 className="product-card__title">{product.title}</h3>

                      <div className="product-card__pricing">
                        {product.originalPrice && (
                          <span className="product-card__original">
                            {product.currencyCode === "USD" ? "USD $" : "$"}
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                        <div className="product-card__price-row">
                          <span className="product-card__price">
                            {product.currencyCode === "USD" ? "USD $" : "$"}
                            {formatPrice(product.price)}
                          </span>
                          {product.discount > 0 && (
                            <span className="product-card__discount">
                              {product.discount}% OFF
                            </span>
                          )}
                        </div>
                        {product.wholesale && (
                          <div className="product-card__wholesale">
                            <span className="product-card__wholesale-badge">Por mayor</span>
                            <span className="product-card__wholesale-info">
                              {product.currencyCode === "USD" ? "USD $" : "$"}
                              {formatPrice(product.wholesale_price)} x {product.wholesale_unit} un.
                            </span>
                          </div>
                        )}
                      </div>

                      {viewMode === "list" && (
                        <p className="product-card__description">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {!isLoading && productsList.length === 0 && (
              <div className="products-page__empty">
                <Search size={48} />
                <h3>No encontramos resultados</h3>
                <p>Prueba ajustando los filtros o realizando otra búsqueda.</p>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Ver todos los productos
                </button>
              </div>
            )}

            {!isLoading && normalizedProductsResponse.totalPages > 1 && (
              <div className="products-page__pagination">
                <button
                  type="button"
                  className="products-page__pagination-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Anterior
                </button>

                <span className="products-page__pagination-info">
                  Página {page} de {normalizedProductsResponse.totalPages}
                </span>

                <button
                  type="button"
                  className="products-page__pagination-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= normalizedProductsResponse.totalPages}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
