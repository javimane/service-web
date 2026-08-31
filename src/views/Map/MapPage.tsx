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
  getProfessionalsAction,
  incrementProfessionalViewsAction,
} from "../../app/actions/professionals";
import Navbar from "../../components/Navbar/Navbar";
import MapSidebar from "./MapSidebar";
import { AlertCircle, CheckCircle2, MapPin, Star, User } from "lucide-react";
import MapPromotionsModal from "./MapPromotionsModal";
import "./MapPage.css";

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
        <div class="custom-map-marker__pin">
          <img src="${avatarUrl}" alt="Local" />
          ${hasPromotions ? '<span class="custom-map-marker__promo-badge">PROMO</span>' : ""}
        </div>
      `,
    iconSize: [46, 46],
    iconAnchor: [23, 46], // punto de anclaje en la base
    popupAnchor: [0, -50], // popup arriba del pin
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

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["map-professionals", center, filters],
    queryFn: async () => {
      const query: any = {
        lat: center.lat,
        lng: center.lng,
        radius: 20,
        public_trade: "true",
        has_promotions: true,
      };

      if (filters.name) query.name = filters.name;
      if (filters.categoryId) query.categoryId = filters.categoryId;
      if (filters.provinceId) query.province_id = filters.provinceId;
      if (filters.departmentId) query.department_id = filters.departmentId;

      const result = await getProfessionalsAction(query);
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: !!center.lat,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10,
  });

  const mappedProfessionals = useMemo(() => {
    return professionals
      .map((p: any) => {
        const addresses =
          p.address ||
          p.Address ||
          p.addresses ||
          p.Addresses ||
          p.Company?.Address
            ? [
                ...(p.address || []),
                ...(p.Address || []),
                ...(p.addresses || []),
                ...(p.Addresses || []),
                ...(p.Company?.Address ? [p.Company.Address] : []),
              ]
            : [];

        const address =
          addresses.find((a: any) => a?.is_main_address) || addresses[0];

        const profile = p.profile || p.Profile;
        const company = p.company || p.Company;
        const isVerified = Boolean(
          p.company_arca?.is_verified ??
          p.companyArca?.is_verified ??
          company?.company_arca?.is_verified ??
          company?.companyArca?.is_verified,
        );

        const avatar =
          profile?.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.display_name || company?.name || "P")}&background=random`;

        const name =
          p.company_name || profile?.display_name || p.name || "Profesional";

        const seoPath = p.seo_path || p.seoPath || null;
        const profileUrl = seoPath
          ? `${ROUTES.profile}${seoPath.startsWith("/") ? seoPath : `/${seoPath}`}`
          : `${ROUTES.profile}/${p.id}`;

        const hasPromotions = Boolean(p.has_promotions || p.hasPromotions);

        const streetName =
          address?.street_name ||
          address?.streetName ||
          address?.street ||
          address?.address ||
          address?.name ||
          "";
        const streetNumber =
          address?.street_number ||
          address?.streetNumber ||
          address?.number ||
          "";
        const streetLine = [streetName, streetNumber].filter(Boolean).join(" ");
        const locationLine =
          address?.Department?.name ||
          address?.department?.name ||
          address?.Province?.name ||
          address?.province?.name ||
          address?.city ||
          "";

        const fullAddress =
          [streetLine, locationLine].filter(Boolean).join(", ") ||
          "Dirección no especificada";

        return {
          id: p.user_id || p.id,
          name,
          companyName: p.company_name || "Sin nombre empresa",
          specialty: p.specialty || p.bio || "Servicios",
          rating: p.ratingAvg || p.rating_avg || 0,
          isVerified,
          avatar,
          seoPath,
          profileUrl,
          hasPromotions,
          addressText: fullAddress,
          coordinates: {
            lat: Number(address?.latitude || 0),
            lng: Number(address?.longitude || 0),
          },
          icon: createCustomIcon(avatar, hasPromotions),
        };
      })
      .filter((p: any) => p.coordinates.lat !== 0 && p.coordinates.lng !== 0);
  }, [professionals]);

  return (
    <div className="map-page">
      <Navbar />

      <main className="map-page__container">
        <MapSidebar
          onFilterChange={handleFilterChange}
          onProvinceCoordinatesChange={handleProvinceCoordinatesChange}
          specialistsCount={mappedProfessionals.length}
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

            {mappedProfessionals.map((prof: any) => (
              <Marker
                key={prof.id}
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
                            incrementProfessionalViewsAction({ id: prof.id });
                            setSelectedProfessionalForPromos(prof.id);
                          }}
                        >
                          Promociones
                        </button>
                      )}
                      <button
                        className="map-info-window__btn"
                        onClick={(e) => {
                          e.preventDefault();
                          incrementProfessionalViewsAction({ id: prof.id });
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
