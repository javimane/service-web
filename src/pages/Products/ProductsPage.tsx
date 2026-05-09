import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Star,
  Truck,
  Grid3X3,
  List,
  ChevronDown,
  Globe,
  MapPin,
  X,
  Filter,
  Loader2,
  Package
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "../../services/productService";
import { categoriesProductService } from "../../services/categoriesProduct";
import { locationService } from "../../services/locationService";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ProductDetailModal from "./ProductDetailModal";
import "./ProductsPage.css";

function formatPrice(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

const sortOptions = [
  { key: "relevant", label: "Más relevantes" },
  { key: "price-asc", label: "Menor precio" },
  { key: "price-desc", label: "Mayor precio" },
];

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "all",
    province: "all",
    is_foreign: "all", // "all", "national", "foreign"
    sortBy: "relevant",
  });
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Data fetching
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => categoriesProductService.listCategoriesProducts(),
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: () => locationService.getProvinces(),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => {
      const params: any = {
        name: filters.search || undefined,
        categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
        province: filters.province === "all" ? undefined : filters.province,
        sortBy: filters.sortBy,
      };
      if (filters.is_foreign !== "all") {
        params.is_foreign = filters.is_foreign === "foreign";
      }
      return productService.list(params);
    },
  });

  const productsList = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data.map((item: any) => {
      const product = item.Product || item;
      const images = product?.Images || [];
      const sortedImages = [...images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      const primaryImage = sortedImages[0]?.image_url || product?.image_url || "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80";

      return {
        id: item.id,
        productId: product?.id,
        title: product?.name || "Producto sin nombre",
        price: item.price || 0,
        originalPrice: item.original_price,
        discount: item.discount_percentage || 0,
        seller: item.Professional?.Company?.name || "Profesional",
        image: primaryImage,
        rating: item.Professional?.rating_avg || 5,
        reviews: 0,
        freeShipping: false,
        description: product?.description || "",
        is_foreign: product?.is_foreign,
        _original: item
      };
    });
  }, [productsData]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      categoryId: "all",
      province: "all",
      is_foreign: "all",
      sortBy: "relevant",
    });
  };

  return (
    <div className="products-page">
      <Navbar />

      <main className="products-page__main">
        {/* Header */}
        <div className="products-page__header">
          <div className="products-page__header-top">
            <div>
              <h1 className="products-page__title">Catálogo de Productos</h1>
              <p className="products-page__subtitle">
                {isLoading ? "Cargando..." : `${productsList.length} productos encontrados`}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="products-page__search-wrapper">
            <div className="products-page__search">
              <Search size={18} />
              <input
                type="text"
                placeholder="¿Qué estás buscando hoy?"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <button 
              className={`products-page__filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filtros
              {Object.values(filters).filter(v => v !== 'all' && v !== '' && v !== 'relevant').length > 0 && (
                <span className="filter-badge" />
              )}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="products-page__filters-panel">
              <div className="filter-group">
                <label><Globe size={14} /> Origen</label>
                <div className="filter-options">
                  {[
                    { id: 'all', name: 'Todos' },
                    { id: 'national', name: 'Nacionales' },
                    { id: 'foreign', name: 'Importados' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      className={`filter-chip ${filters.is_foreign === opt.id ? 'active' : ''}`}
                      onClick={() => handleFilterChange("is_foreign", opt.id)}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label><MapPin size={14} /> Provincia</label>
                <select 
                  value={filters.province}
                  onChange={(e) => handleFilterChange("province", e.target.value)}
                >
                  <option value="all">Todas las provincias</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label><Package size={14} /> Categoría</label>
                <select 
                  value={filters.categoryId}
                  onChange={(e) => handleFilterChange("categoryId", e.target.value)}
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button className="clear-filters-btn" onClick={clearFilters}>
                Limpiar Filtros
              </button>
            </div>
          )}

          {/* Filters row (Quick Sort/View) */}
          <div className="products-page__filters-row">
            <div className="products-page__quick-categories">
              <button
                className={`products-page__category-chip ${filters.categoryId === 'all' ? "active" : ""}`}
                onClick={() => handleFilterChange("categoryId", "all")}
              >
                Todas
              </button>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`products-page__category-chip ${filters.categoryId === cat.name ? "active" : ""}`}
                  onClick={() => handleFilterChange("categoryId", cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="products-page__controls">
              <div className="products-page__sort">
                <SlidersHorizontal size={14} />
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
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
          </div>
        </div>

        {/* Products Grid/List */}
        <div
          className={`products-page__grid ${viewMode === "list" ? "products-page__grid--list" : ""}`}
        >
          {isLoading ? (
            <div className="products-page__loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Cargando productos...</p>
            </div>
          ) : productsList.map((product) => (
            <button
              key={product.id}
              type="button"
              className={`product-card ${viewMode === "list" ? "product-card--list" : ""}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="product-card__image">
                <img src={product.image} alt={product.title} />
                {product.is_foreign && (
                  <span className="product-card__badge-foreign">
                    <Globe size={10} /> IMPORTADO
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="product-card__badge-discount">
                    -{product.discount}%
                  </span>
                )}
              </div>

              <div className="product-card__body">
                <span className="product-card__seller">{product.seller}</span>
                <h3 className="product-card__title">{product.title}</h3>

                <div className="product-card__pricing">
                  {product.originalPrice && (
                    <span className="product-card__original">
                      ${formatPrice(product.originalPrice)}
                    </span>
                  )}
                  <div className="product-card__price-row">
                    <span className="product-card__price">
                      ${formatPrice(product.price)}
                    </span>
                    {product.discount > 0 && (
                      <span className="product-card__discount">
                        {product.discount}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <div className="product-card__rating">
                  <div className="product-card__stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        fill={
                          i < Math.round(product.rating)
                            ? "currentColor"
                            : "none"
                        }
                        className={
                          i < Math.round(product.rating)
                            ? "star-filled"
                            : "star-empty"
                        }
                      />
                    ))}
                  </div>
                </div>

                {viewMode === "list" && (
                  <p className="product-card__description">
                    {product.description}
                  </p>
                )}
              </div>
            </button>
          ))}
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
      </main>

      <Footer />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
