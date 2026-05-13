import { useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Truck, Loader2, Globe, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "../../../services/productService";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import ProductDetailModal from "../../Products/ProductDetailModal";
import "./ProductsCarousel.css";

function formatPrice(n) {
  return Number(n || 0).toLocaleString("es-AR");
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

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["foreign-products"],
    queryFn: () => productService.list({ is_foreign: true, limit: 20 }),
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
        _original: item
      };
    });
  }, [productsData]);

  return (
    <section className="products-carousel-section">
      <div className="home-section-container">
        <div className="products-carousel-section__header">
          <div className="products-carousel-section__title-group">
            <h2 className="products-carousel-section__title">Productos Importados</h2>
            <p className="products-carousel-section__subtitle">Calidad internacional a un solo clic</p>
          </div>
          <button className="section-link" onClick={() => navigate("/products")}>
            Ver todo <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
        <div className="products-carousel-section__carousel">
        {isLoading ? (
          <div className="products-carousel-section__loading">
            <Loader2 className="animate-spin" size={32} />
            <p>Cargando catálogo internacional...</p>
          </div>
        ) : productsList.length === 0 ? (
          <div className="products-carousel-section__empty">
            <Globe size={40} className="empty-icon" />
            <h3>No hay productos importados disponibles</h3>
            <p>Vuelve más tarde para ver nuevas incorporaciones.</p>
          </div>
        ) : (
          <>
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
              {productsList.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="product-carousel-card"
                  onClick={() => setSelectedProduct(product._original)}
                >
                  <div className="product-carousel-card__image">
                    <img src={product.image} alt={product.title} draggable="false" />
                    <div className="product-carousel-card__badges">
                      <span className="product-carousel-card__badge-foreign">
                        <Globe size={10} /> IMPORTADO
                      </span>
                      {product.discount > 0 && (
                        <span className="product-carousel-card__badge-discount">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="product-carousel-card__body">
                    <span className="product-carousel-card__seller">{product.seller}</span>
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
          </>
        )}
      </div>
    </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
