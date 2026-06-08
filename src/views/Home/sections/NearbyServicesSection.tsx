"use client";
import { useRef, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  User,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import NearbyServiceCard from "../../../components/Cards/NearbyServiceCard";
import Modal from "../../../components/Modal/Modal";
import useCarouselDrag from "../../../hooks/useCarouselDrag";
import "./NearbyServicesSection.css";
import { ROUTES } from "../../../routes/paths";
import { getProfilePath } from "../../../utils/utils";
import { getServicesAction } from "@/app/actions/services";

type UserLocation = {
  lat: number;
  lng: number;
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearbyServicesSection({
  userProvince = "Buenos Aires",
}: {
  userProvince?: string;
}) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const {
    showLeftArrow,
    showRightArrow,
    scrollCarousel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateArrowVisibility,
  } = useCarouselDrag(sliderRef, ".nearby-card");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation blocked, using default location", err);
        setUserLocation({ lat: -34.6037, lng: -58.3816 }); // Default (Buenos Aires)
      },
    );
  }, []);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["nearby-services", userLocation, userProvince],
    queryFn: async () => {
      const result = await getServicesAction({
        province: userProvince,
        // we can still pass lat/lng for sorting by distance if getServicesAction supports it
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: 30, // 30km radius
        is_premium: true,
        limit: 25,
      });

      if (result?.data) {
        return result.data;
      }

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      return null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const handleServiceClick = (service) => {
    setSelectedService(service);
  };

  const handleMessageProfessional = (professionalId) => {
    router.push(`/messages?to=${professionalId}`);
  };

  const handleViewProfile = (professionalId, seoPath?: string) => {
    router.push(getProfilePath(professionalId, seoPath));
  };

  return (
    <section className="nearby-services">
      <div className="home-section-container">
        <div className="nearby-services__header">
          <div className="nearby-services__title-group">
            <h2 className="nearby-services__title">
              Servicios Destacados en {userProvince}
            </h2>
          </div>
          <button
            className="section-link"
            onClick={() => router.push(ROUTES.map)}
          >
            Explorar mapa <span>&gt;</span>
          </button>
        </div>
      </div>

      <div className="home-section-container">
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
            className={`nearby-services__scroll ${isLoading ? "loading" : ""}`}
            onScroll={updateArrowVisibility}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {isLoading ? (
              <div className="nearby-loading">
                <Loader2 className="animate-spin" size={32} />
                <p>Buscando servicios cercanos...</p>
              </div>
            ) : services.length > 0 ? (
              services.map((service) => {
                const prof = service.professional || service.Professional;
                let calculatedDist: number | null = null;
                if (userLocation && prof?.address?.[0]) {
                  const addr = prof.address[0];
                  if (addr.latitude != null && addr.longitude != null) {
                    calculatedDist = calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      Number(addr.latitude),
                      Number(addr.longitude),
                    );
                  }
                }

                const distanceStr =
                  calculatedDist !== null
                    ? `${calculatedDist.toFixed(2)} km`
                    : "Cerca";

                return (
                  <NearbyServiceCard
                    key={service.id}
                    service={{
                      ...service,
                      professional: prof,
                      Professional: prof,
                      name: service.name,
                      avatar:
                        prof?.profile?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(prof?.profile?.display_name || "P")}`,
                      price: `$${service.base_price?.toLocaleString() || "0"}`,
                      distance: distanceStr,
                      rating: prof?.rating_avg || 1.0,
                    }}
                    onClick={handleServiceClick}
                  />
                );
              })
            ) : (
              <div className="nearby-empty">
                <MapPin size={40} />
                <p>No se encontraron servicios premium en tu zona.</p>
              </div>
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
      </div>

      <Modal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        title="Detalle del Servicio"
      >
        {selectedService && (
          <div className="service-modal">
            <div className="service-modal__header">
              <div
                className="professional-mini-card"
                onClick={() =>
                  handleViewProfile(
                    selectedService.Professional?.id,
                    selectedService.Professional?.seo_path,
                  )
                }
              >
                <img
                  src={
                    selectedService.professional?.profile?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedService.professional?.profile?.display_name || "P")}`
                  }
                  alt="Professional"
                  className="prof-avatar"
                />
                <div>
                  <h4 className="prof-name">
                    {selectedService.professional?.profile?.display_name ||
                      "Profesional"}
                  </h4>
                  <p className="prof-label">Profesional Verificado</p>
                </div>
              </div>
              <div className="service-modal__price">
                ${selectedService.base_price?.toLocaleString()}
              </div>
            </div>

            <div className="service-modal__body">
              <h3 className="service-name">{selectedService.name}</h3>
              <p className="service-desc">{selectedService.description}</p>

              <div className="service-stats">
                <div className="stat">
                  <MapPin size={16} />
                  <span>{selectedService.distance || "En tu zona"}</span>
                </div>
                <div className="stat">
                  <Star
                    size={16}
                    fill="var(--highlight)"
                    color="var(--highlight)"
                  />
                  <span>
                    {selectedService.Professional?.rating_avg || "5.0"} (
                    {selectedService.Professional?.completed_jobs || 0}{" "}
                    trabajos)
                  </span>
                </div>
              </div>
            </div>

            <div className="service-modal__actions">
              <button
                className="btn-view-profile"
                onClick={() =>
                  handleViewProfile(
                    selectedService.Professional?.id,
                    selectedService.Professional?.seo_path,
                  )
                }
              >
                <User size={18} /> VER PERFIL
              </button>
              <button
                className="btn-request-msg"
                onClick={() =>
                  handleMessageProfessional(selectedService.Professional?.id)
                }
              >
                <MessageCircle size={18} /> SOLICITAR SERVICIO
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
