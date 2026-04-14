import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NearbyServiceCard from "../../../components/Cards/NearbyServiceCard";
import Modal from "../../../components/Modal/Modal";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./NearbyServicesSection.css";

const nearbyServices = [
  {
    id: 101,
    name: "Carlos Plomería",
    avatar: "https://i.pravatar.cc/150?u=carlos2",
    description: "Reparación de filtraciones y mantenimiento general.",
    price: "$25.000",
    distance: "1.2 km",
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 102,
    name: "Electricidad Express",
    avatar: "https://i.pravatar.cc/150?u=elec",
    description: "Urgencias eléctricas 24/7 y tableros.",
    price: "$30.000",
    distance: "2.5 km",
    rating: 4.9,
    reviews: 89,
  },
  {
    id: 103,
    name: "Limpieza Profunda Ana",
    avatar: "https://i.pravatar.cc/150?u=ana2",
    description: "Limpieza residencial y oficinas, post-obra.",
    price: "$18.000",
    distance: "3.1 km",
    rating: 4.7,
    reviews: 210,
  },
  {
    id: 104,
    name: "Pintura y Deco Juan",
    avatar: "https://i.pravatar.cc/150?u=juan",
    description: "Pintura interior, exterior y texturados.",
    price: "$45.000",
    distance: "4.0 km",
    rating: 4.6,
    reviews: 56,
  },
  {
    id: 105,
    name: "Tech Support IT",
    avatar: "https://i.pravatar.cc/150?u=tech",
    description: "Armado de PC, limpieza de virus y redes.",
    price: "$20.000",
    distance: "5.2 km",
    rating: 5.0,
    reviews: 42,
  },
];

export default function NearbyServicesSection() {
  const [selectedService, setSelectedService] = useState(null);
  const sliderRef = useRef(null);
  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".nearby-card");

  const handleServiceClick = (service) => {
    setSelectedService(service);
  };

  return (
    <section className="nearby-services">
      <div className="nearby-services__header">
        <div>
          <span className="section-label">A tu alrededor</span>
          <h2 className="nearby-services__title">Servicios cerca de ti</h2>
        </div>
        <button className="section-link">Explorar mapa</button>
      </div>

      <div className="nearby-services__carousel">
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
          className="nearby-services__scroll"
          onScroll={updateArrowVisibility}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {nearbyServices.map((service) => (
            <NearbyServiceCard
              key={service.id}
              service={service}
              onClick={handleServiceClick}
            />
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

      <Modal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        title={selectedService?.name || "Detalle del servicio"}
      >
        {selectedService && (
          <div className="service-modal">
            <div className="service-modal__header">
              <div>
                <h3>{selectedService.name}</h3>
                <p>{selectedService.description}</p>
              </div>
              <div className="service-modal__price">
                {selectedService.price}
              </div>
            </div>
            <div className="service-modal__info">
              <span>Distancia: {selectedService.distance}</span>
              <span>
                Rating: {selectedService.rating} ({selectedService.reviews}{" "}
                reseñas)
              </span>
            </div>
            <button className="section-link" type="button">
              Reservar ahora
            </button>
          </div>
        )}
      </Modal>
    </section>
  );
}
