import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Star,
  Truck,
  Grid3X3,
  List,
  ChevronDown,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { products } from "../../data/products";
import ProductDetailModal from "./ProductDetailModal";
import "./ProductsPage.css";

function formatPrice(n) {
  return n.toLocaleString("es-AR");
}

const categories = [
  "Todas",
  "Herramientas",
  "Medición",
  "Pintura",
  "Almacenamiento",
  "Escaleras",
];

const sortOptions = [
  { key: "relevant", label: "Más relevantes" },
  { key: "price-asc", label: "Menor precio" },
  { key: "price-desc", label: "Mayor precio" },
  { key: "rating", label: "Mejor valorados" },
  { key: "discount", label: "Mayor descuento" },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("relevant");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  let filtered = products.filter((p) => {
    const matchSearch = p.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchCategory =
      activeCategory === "Todas" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "discount":
        return b.discount - a.discount;
      default:
        return 0;
    }
  });

  return (
    <div className="products-page">
      <Navbar />

      <main className="products-page__main">
        {/* Header */}
        <div className="products-page__header">
          <div className="products-page__header-top">
            <div>
              <h1 className="products-page__title">Productos</h1>
              <p className="products-page__subtitle">
                {filtered.length} productos disponibles
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="products-page__search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters row */}
          <div className="products-page__filters-row">
            <div className="products-page__categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`products-page__category-chip ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="products-page__controls">
              <div className="products-page__sort">
                <SlidersHorizontal size={14} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              className={`product-card ${viewMode === "list" ? "product-card--list" : ""}`}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="product-card__image">
                <img src={product.image} alt={product.title} />
                {product.discount > 0 && (
                  <span className="product-card__badge">
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

                {product.freeShipping && (
                  <div className="product-card__shipping">
                    <Truck size={14} />
                    <span>Envío gratis</span>
                  </div>
                )}

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
                  <span className="product-card__reviews">
                    ({product.reviews})
                  </span>
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

        {filtered.length === 0 && (
          <div className="products-page__empty">
            <Search size={48} />
            <p>No se encontraron productos</p>
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
