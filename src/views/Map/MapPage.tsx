"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "../../routes/paths";
import {
  getProfessionalMapLocationsAction,
  incrementProfessionalViewsAction,
} from "../../app/actions/professionals";
import Navbar from "../../components/Navbar/Navbar";
import MapSidebar from "./MapSidebar";
import { AlertCircle, CheckCircle2, MapPin, Star, User } from "lucide-react";
import MapPromotionsModal from "./MapPromotionsModal";
import "./MapPage.css";

type ProfessionalMapLocation = {
  id: string;
  professional_id: number;
  name: string;
  company_name: string;
  avatar_url: string | null;
  specialty: string | null;
  rating_avg: number | null;
  is_verified: boolean;
  has_promotions: boolean;
  seo_path: string;
  street_name: string | null;
  street_number: string | null;
  latitude: number;
  longitude: number;
};

const defaultCenter = {
  lat: -34.6037, // Buenos Aires
  lng: -58.3816,
};

// Componente para actualizar el centro del mapa programáticamente y ajustar tamaño en colapso
function MapUpdater({
  flyToCenter,
  isCollapsed,
}: {
  flyToCenter: { lat: number; lng: number } | null;
  isCollapsed: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (flyToCenter) {
      map.flyTo([flyToCenter.lat, flyToCenter.lng], 13, { animate: true });
    }
  }, [flyToCenter, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 300); // Esperar a que termine la transición (0.3s)
    return () => clearTimeout(timer);
  }, [isCollapsed, map]);

  return null;
}

// Componente para escuchar el desplazamiento manual del usuario en el mapa
function MapEventsListener({
  onCenterChange,
}: {
  onCenterChange: (center: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const newCenter = map.getCenter();
      onCenterChange({ lat: newCenter.lat, lng: newCenter.lng });
    },
  });
  return null;
}

// Crear un icono personalizado con foto de perfil y efecto de pulso
const createCustomIcon = (avatarUrl: string, hasPromotions: boolean) => {
  return L.divIcon({
    className: `custom-map-marker ${hasPromotions ? "custom-map-marker--has-promotions" : ""}`,
    html: `
        <div class="custom-map-marker__wrapper">
          ${hasPromotions ? '<span class="custom-map-marker__promo-badge">PROMOS</span>' : ""}
          <div class="custom-map-marker__pin">
            <img src="${avatarUrl}" alt="Local" />
          </div>
        </div>
      `,
    iconSize: [46, 46],
    iconAnchor: [23, 46], // punto de anclaje en la base
    popupAnchor: [0, -52], // popup arriba del pin
  });
};

const getInitialCenter = () => {
  const saved = localStorage.getItem("lastMapCenter");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return defaultCenter;
};

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [center, setCenter] = useState(getInitialCenter);
  const [flyToCenter, setFlyToCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [filters, setFilters] = useState<{
    name: string;
    categoryId?: string;
    provinceId?: string;
    departmentId?: string;
  }>({
    name: "",
    categoryId: undefined,
    provinceId: undefined,
    departmentId: undefined,
  });

  const [selectedProfessionalForPromos, setSelectedProfessionalForPromos] =
    useState<number | string | null>(null);

  const handleProvinceCoordinatesChange = useCallback(
    (coords: { lat: number; lng: number } | null) => {
      if (coords) {
        setCenter(coords);
        setFlyToCenter(coords);
        localStorage.setItem("lastMapCenter", JSON.stringify(coords));
      }
    },
    [],
  );

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleMapCenterChange = useCallback(
    (newCenter: { lat: number; lng: number }) => {
      setCenter((prev) => {
        // Actualizar solo si el usuario se desplazó una distancia apreciable (> 0.01 grados (~1km)) para evitar llamadas redundantes
        const latDiff = Math.abs(prev.lat - newCenter.lat);
        const lngDiff = Math.abs(prev.lng - newCenter.lng);
        if (latDiff > 0.01 || lngDiff > 0.01) {
          localStorage.setItem("lastMapCenter", JSON.stringify(newCenter));
          return newCenter;
        }
        return prev;
      });
    },
    [],
  );

  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    if (latParam && lngParam) {
      const newCenter = {
        lat: Number(latParam),
        lng: Number(lngParam),
      };
      setCenter(newCenter);
      setFlyToCenter(newCenter);
      localStorage.setItem("lastMapCenter", JSON.stringify(newCenter));
    }
  }, [searchParams]);

  // Request location permission
  useEffect(() => {
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    if (latParam && lngParam) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newCenter);
          setFlyToCenter(newCenter);
          localStorage.setItem("lastMapCenter", JSON.stringify(newCenter));
        },
        () => {
          console.log("Location permission denied or error.");
        },
      );
    }
  }, []);

  const { data: locations = [], isLoading } = useQuery<ProfessionalMapLocation[]>({
    queryKey: ["map-locations", filters, filters.provinceId ? null : center],
    queryFn: async () => {
      const result = await getProfessionalMapLocationsAction({
        ...(!filters.provinceId ? { lat: center.lat, lng: center.lng, radius: 20 } : {}),
        name: filters.name || undefined,
        categoryId: filters.categoryId,
        provinceId: filters.provinceId,
        departmentId: filters.departmentId,
      });
      return Array.isArray(result?.data) ? result.data as ProfessionalMapLocation[] : [];
    },
    enabled: !!center.lat,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10,
  });

  const mappedLocations = useMemo(() => locations.map((location) => {
    const avatar = location.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(location.company_name)}&background=random`;
    return {
      id: location.id,
      professionalId: location.professional_id,
      name: location.name,
      companyName: location.company_name,
      specialty: location.specialty || "Servicios",
      rating: location.rating_avg ?? 0,
      isVerified: location.is_verified,
      avatar,
      profileUrl: `${ROUTES.profile}/${location.seo_path.replace(/^\//, "")}`,
      hasPromotions: location.has_promotions,
      addressText: [location.street_name, location.street_number].filter(Boolean).join(" ") || "Dirección no especificada",
      coordinates: { lat: location.latitude, lng: location.longitude },
      icon: createCustomIcon(avatar, location.has_promotions),
    };
  }), [locations]);

  return (
    <div className="map-page">
      <Navbar />

      <main className="map-page__container">
        <MapSidebar
          onFilterChange={handleFilterChange}
          onProvinceCoordinatesChange={handleProvinceCoordinatesChange}
          specialistsCount={mappedLocations.length}
          isLoading={isLoading}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        <div className="map-page__map-wrapper">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={13}
            className="map-page__map"
            zoomControl={false}
          >
            <MapUpdater
              flyToCenter={flyToCenter}
              isCollapsed={isSidebarCollapsed}
            />
            <MapEventsListener onCenterChange={handleMapCenterChange} />

            {/* OpenStreetMap TileLayer (100% libre sin API key) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mappedLocations.map((prof) => (
              <Marker
                key={`${prof.professionalId}:${prof.id}`}
                position={[prof.coordinates.lat, prof.coordinates.lng]}
                icon={prof.icon}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="map-info-window">
                    <img src={prof.avatar} alt={prof.name} />
                    <div className="map-info-window__content">
                      <h3>{prof.name}</h3>
                      <p>{prof.companyName}</p>
                      <p>{prof.specialty}</p>
                      <p className="map-info-window__address">
                        <MapPin size={12} /> {prof.addressText}
                      </p>
                      <div className="map-info-window__meta">
                        <span>
                          <Star size={12} fill="currentColor" /> {prof.rating}
                        </span>
                        <span
                          className={`badge ${prof.isVerified ? "badge--verified" : "badge--unverified"}`}
                          title={
                            prof.isVerified
                              ? "Verificado en ARCA"
                              : "Sin verificación en ARCA"
                          }
                        >
                          {prof.isVerified ? (
                            <>
                              <CheckCircle2 size={12} /> Verificado
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} /> Sin verificar
                            </>
                          )}
                        </span>
                      </div>
                      {prof.hasPromotions && (
                        <button
                          className="map-info-window__btn map-info-window__btn--promo"
                          onClick={(e) => {
                            e.preventDefault();
                            incrementProfessionalViewsAction({ id: prof.professionalId });
                            setSelectedProfessionalForPromos(prof.professionalId);
                          }}
                        >
                          Promociones
                        </button>
                      )}
                      <button
                        className="map-info-window__btn"
                        onClick={(e) => {
                          e.preventDefault();
                          incrementProfessionalViewsAction({ id: prof.professionalId });
                          router.push(prof.profileUrl);
                        }}
                      >
                        <User size={14} />
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>

      <MapPromotionsModal
        isOpen={!!selectedProfessionalForPromos}
        onClose={() => setSelectedProfessionalForPromos(null)}
        professionalId={selectedProfessionalForPromos}
      />
    </div>
  );
}
