import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Truck } from "lucide-react";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import { products } from "../../../data/products";
import ProductDetailModal from "../../Products/ProductDetailModal";
import "./ProductsCarousel.css";

function formatPrice(n) {
  return n.toLocaleString("es-AR");
}

export default function ProductsCarousel() {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".product-carousel-card");

  return (
    <section className="products-carousel-section">
      <div className="products-carousel-section__header">
        <div>
          <span className="section-label">Productos</span>
          <h2 className="products-carousel-section__title">
            Herramientas y materiales
          </h2>
        </div>
        <button className="section-link" onClick={() => navigate("/products")}>
          Ver todo
        </button>
      </div>

      <div className="products-carousel-section__carousel">
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
          className="products-carousel-section__scroll"
          onScroll={updateArrowVisibility}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className="product-carousel-card"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="product-carousel-card__image">
                <img src={product.image} alt={product.title} />
                {product.discount > 0 && (
                  <span className="product-carousel-card__badge">
                    -{product.discount}%
                  </span>
                )}
              </div>

              <div className="product-carousel-card__body">
                <h3 className="product-carousel-card__title">
                  {product.title}
                </h3>

                <div className="product-carousel-card__pricing">
                  {product.originalPrice && (
                    <span className="product-carousel-card__original">
                      ${formatPrice(product.originalPrice)}
                    </span>
                  )}
                  <div className="product-carousel-card__price-row">
                    <span className="product-carousel-card__price">
                      ${formatPrice(product.price)}
                    </span>
                    {product.discount > 0 && (
                      <span className="product-carousel-card__discount">
                        {product.discount}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {product.freeShipping && (
                  <div className="product-carousel-card__shipping">
                    <Truck size={12} />
                    <span>Envío gratis</span>
                  </div>
                )}

                <div className="product-carousel-card__rating">
                  <Star size={12} fill="currentColor" className="star-filled" />
                  <span>{product.rating}</span>
                  <span className="product-carousel-card__reviews">
                    ({product.reviews})
                  </span>
                </div>
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

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
