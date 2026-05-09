import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, MapPin, Truck, Loader2, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "../../../services/productService";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import NearbyProductDetailModal from "./NearbyProductDetailModal";
import "./NearbyProductsSection.css";

const nearbyProducts = [
  {
    id: 201,
    title: "Instalación completa de termotanque solar 200L",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_601215-MLA32803262928_112019-F.webp",
    price: 185000,
    originalPrice: 220000,
    discount: 16,
    rating: 4.9,
    reviews: 87,
    freeShipping: false,
    distance: "1.3 km",
    seller: "EcoSolar Instalaciones",
    sellerAvatar: "https://i.pravatar.cc/150?u=ecosolar",
    sellerPhone: "5491112345678",
    sellerId: "prof-201",
    category: "Instalaciones",
    condition: "Servicio + producto",
    stock: 10,
    description:
      "Servicio de instalación de termotanque solar de 200 litros. Incluye equipo, materiales y mano de obra. Garantía de 2 años. Ideal para familias de 3-4 personas.",
    features: [
      "Capacidad: 200 litros",
      "Incluye instalación completa",
      "Garantía: 2 años",
      "Tiempo de instalación: 1 día",
      "Ahorro energético: hasta 70%",
    ],
  },
  {
    id: 202,
    title: "Kit eléctrico completo para departamento 2 ambientes",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_988521-MLA44520267498_012021-F.webp",
    price: 95000,
    originalPrice: 115000,
    discount: 17,
    rating: 4.7,
    reviews: 134,
    freeShipping: true,
    distance: "2.1 km",
    seller: "Electro Martínez",
    sellerAvatar: "https://i.pravatar.cc/150?u=electromartinez",
    sellerPhone: "5491198765432",
    sellerId: "prof-202",
    category: "Electricidad",
    condition: "Nuevo",
    stock: 25,
    description:
      "Kit completo de materiales eléctricos para un departamento de 2 ambientes. Incluye cables, llaves térmicas, disyuntor diferencial, tomas y tapas. Certificado por norma IRAM.",
    features: [
      "Cable unipolar 2.5mm² y 4mm²",
      "Térmica bipolar 20A",
      "Disyuntor diferencial 25A",
      "10 módulos de tomas y tapas",
      "Certificación IRAM",
    ],
  },
  {
    id: 203,
    title: "Pintura exterior impermeabilizante 20L + aplicación",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_918478-MLA48658593498_122021-F.webp",
    price: 67000,
    originalPrice: 82000,
    discount: 18,
    rating: 4.8,
    reviews: 203,
    freeShipping: false,
    distance: "0.8 km",
    seller: "Pinturería del Barrio",
    sellerAvatar: "https://i.pravatar.cc/150?u=pintureria",
    sellerPhone: "5491155667788",
    sellerId: "prof-203",
    category: "Pintura",
    condition: "Nuevo",
    stock: 40,
    description:
      "Pintura impermeabilizante para exterior de 20 litros, ideal para techos y paredes expuestas. Incluye servicio de aplicación profesional. Rendimiento: 6m² por litro.",
    features: [
      "Contenido: 20 litros",
      "Tipo: Impermeabilizante elastomérico",
      "Rendimiento: 6m²/litro",
      "Incluye aplicación profesional",
      "Garantía anti-filtraciones: 5 años",
    ],
  },
  {
    id: 204,
    title: "Cerradura digital smart con instalación incluida",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_730841-MLA48216122962_112021-F.webp",
    price: 145000,
    originalPrice: 175000,
    discount: 17,
    rating: 4.6,
    reviews: 56,
    freeShipping: true,
    distance: "3.5 km",
    seller: "Cerrajería Smart Home",
    sellerAvatar: "https://i.pravatar.cc/150?u=smarthome",
    sellerPhone: "5491144332211",
    sellerId: "prof-204",
    category: "Seguridad",
    condition: "Nuevo",
    stock: 15,
    description:
      "Cerradura digital con apertura por huella, código y app móvil. Incluye instalación profesional y configuración. Compatible con puertas de madera y metal.",
    features: [
      "Apertura: huella, código, app, llave",
      "Hasta 100 huellas registrables",
      "Batería: 8 meses de duración",
      "Incluye instalación profesional",
      "Alarma anti-manipulación",
    ],
  },
  {
    id: 205,
    title: "Mesada de granito gris Mara pulido a medida",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_667790-MLA31140498498_062019-F.webp",
    price: 320000,
    originalPrice: 380000,
    discount: 16,
    rating: 5.0,
    reviews: 42,
    freeShipping: false,
    distance: "4.2 km",
    seller: "Marmolería Giardino",
    sellerAvatar: "https://i.pravatar.cc/150?u=marmoleria",
    sellerPhone: "5491177889900",
    sellerId: "prof-205",
    category: "Muebles",
    condition: "A medida",
    stock: 5,
    description:
      "Mesada de granito gris Mara pulido, fabricada a medida para tu cocina o baño. Incluye medición, fabricación, transporte e instalación. Bordes pulidos a elección.",
    features: [
      "Material: Granito Gris Mara",
      "Espesor: 2cm",
      "Incluye medición e instalación",
      "Bordes pulidos a elección",
      "Tiempo de entrega: 7-10 días",
    ],
  },
  {
    id: 206,
    title: "Kit cañerías PPR termofusión baño completo",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_839418-MLA48864506791_012022-F.webp",
    price: 42000,
    originalPrice: 55000,
    discount: 24,
    rating: 4.7,
    reviews: 178,
    freeShipping: true,
    distance: "1.8 km",
    seller: "PlomeroYa",
    sellerAvatar: "https://i.pravatar.cc/150?u=plomeroya",
    sellerPhone: "5491166554433",
    sellerId: "prof-206",
    category: "Plomería",
    condition: "Nuevo",
    stock: 60,
    description:
      "Kit completo de cañerías de polipropileno PPR para un baño completo. Incluye caños, codos, tees, llaves de paso y termofusionadora en préstamo. Material de primera calidad.",
    features: [
      "Caños PPR 20mm y 25mm",
      "Incluye accesorios completos",
      "Termofusionadora en préstamo",
      "Garantía de 50 años en material",
      "Asesoramiento de instalación",
    ],
  },
  {
    id: 207,
    title: "Aire acondicionado split 3000 frigorías + instalación",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_697285-MLA44670699578_012021-F.webp",
    price: 520000,
    originalPrice: 620000,
    discount: 16,
    rating: 4.8,
    reviews: 312,
    freeShipping: false,
    distance: "2.9 km",
    seller: "Clima Total",
    sellerAvatar: "https://i.pravatar.cc/150?u=climatotal",
    sellerPhone: "5491122334455",
    sellerId: "prof-207",
    category: "Climatización",
    condition: "Nuevo",
    stock: 8,
    description:
      "Aire acondicionado split frío/calor de 3000 frigorías, eficiencia clase A. Incluye instalación profesional con hasta 3 metros de caño. Ideal para ambientes de 20-30m².",
    features: [
      "Capacidad: 3000 frigorías",
      "Eficiencia: Clase A",
      "Frío/Calor",
      "Incluye instalación (hasta 3m caño)",
      "Gas ecológico R410a",
    ],
  },
  {
    id: 208,
    title: "Reja de seguridad para ventana 150x120cm",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_2X_637027-MLA41408055398_042020-F.webp",
    price: 78000,
    originalPrice: 95000,
    discount: 18,
    rating: 4.5,
    reviews: 94,
    freeShipping: false,
    distance: "5.0 km",
    seller: "Herrería del Sur",
    sellerAvatar: "https://i.pravatar.cc/150?u=herreria",
    sellerPhone: "5491133445566",
    sellerId: "prof-208",
    category: "Seguridad",
    condition: "A medida",
    stock: 20,
    description:
      "Reja de seguridad artística para ventana, fabricada en hierro macizo con tratamiento antioxidante. Medida estándar 150x120cm, adaptable a medida. Incluye colocación.",
    features: [
      "Material: Hierro macizo 12mm",
      "Medida: 150 x 120 cm",
      "Tratamiento antioxidante",
      "Incluye colocación",
      "Diseño a elección",
    ],
  },
];

function formatPrice(n: number) {
  return n.toLocaleString("es-AR");
}

export default function NearbyProductsSection() {
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".nearby-product-card");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {
        setUserLocation({ lat: -34.6037, lng: -58.3816 }); // Default
      }
    );
  }, []);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["nearby-products", userLocation],
    queryFn: () => productService.list({
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: 30,
      is_premium: true,
      limit: 20
    }),
    enabled: !!userLocation
  });

  const productsList = productsData?.data || [];

  return (
    <section className="nearby-products">
      <div className="nearby-products__header">
        <h2 className="nearby-products__title">Productos de la App</h2>
        <button className="section-link" onClick={() => navigate("/products")}>
          Ver todo &gt;
        </button>
      </div>

      <div className="nearby-products__carousel">
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
          className="nearby-products__scroll"
          onScroll={updateArrowVisibility}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {isLoading ? (
            <div className="products-loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Buscando productos cercanos...</p>
            </div>
          ) : productsList.length === 0 ? (
            <div className="products-empty">
              <Sparkles size={40} />
              <p>No se encontraron productos premium cerca.</p>
            </div>
          ) : (
            productsList.map((item) => (
              <article
                key={item.id}
                className="nearby-product-card"
                onClick={() => setSelectedProduct(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedProduct(item);
                  }
                }}
              >
                <div className="nearby-product-card__image">
                  <img
                    src={item.Product?.image_url?.[0] || "https://via.placeholder.com/300"}
                    alt={item.Product?.name}
                    draggable="false"
                  />
                  {item.offer_price && (
                    <span className="nearby-product-card__badge">
                      OFERTA
                    </span>
                  )}
                </div>

                <div className="nearby-product-card__body">
                  <div className="nearby-product-card__seller-row">
                    <img
                      src={item.Professional?.Profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.Professional?.Profile?.display_name || "P")}`}
                      alt={item.Professional?.Profile?.display_name}
                      className="nearby-product-card__seller-avatar"
                      draggable="false"
                    />
                    <span className="nearby-product-card__seller-name">
                      {item.Professional?.Profile?.display_name || item.Professional?.Company?.name}
                    </span>
                  </div>

                  <h3 className="nearby-product-card__title">{item.Product?.name}</h3>

                  <div className="nearby-product-card__pricing">
                    {item.offer_price && (
                      <span className="nearby-product-card__original">
                        ${formatPrice(item.price)}
                      </span>
                    )}
                    <div className="nearby-product-card__price-row">
                      <span className="nearby-product-card__price">
                        ${formatPrice(item.offer_price || item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="nearby-product-card__meta">
                    <span className="nearby-product-card__distance">
                      <MapPin size={12} /> {item.distance ? `${item.distance.toFixed(1)} km` : "Cerca"}
                    </span>
                    <span className="nearby-product-card__rating">
                      <Star size={12} fill="currentColor" /> {item.Professional?.rating_avg || "5.0"}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
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

      <NearbyProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
