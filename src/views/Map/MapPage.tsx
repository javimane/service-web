"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
import { AlertCircle, CheckCircle2, Star, User } from "lucide-react";
import "./MapPage.css";

const defaultCenter = {
  lat: -34.6037, // Buenos Aires
  lng: -58.3816,
};

// Componente para actualizar el centro del mapa y ajustar tamaño en colapso
function MapUpdater({
  center,
  isCollapsed,
}: {
  center: { lat: number; lng: number };
  isCollapsed: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 13, { animate: true });
  }, [center.lat, center.lng, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 300); // Esperar a que termine la transición (0.3s)
    return () => clearTimeout(timer);
  }, [isCollapsed, map]);

  return null;
}

// Crear un icono personalizado con foto de perfil y efecto de pulso
const createCustomIcon = (avatarUrl: string, hasPromotions: boolean) => {
  return L.divIcon({
    className: `custom-map-marker ${hasPromotions ? "custom-map-marker--has-promotions" : ""}`,
    html: `
        <div class="custom-map-marker__pin">
          <img src="${avatarUrl}" alt="avatar" />
          ${hasPromotions ? '<span class="custom-map-marker__promo-badge">PROMO</span>' : ""}
        </div>
        <div class="custom-map-marker__pulse"></div>
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
  const [filters, setFilters] = useState<{
    search: string;
    categoryId?: string;
    provinceId?: string;
    departmentId?: string;
  }>({
    search: "",
    categoryId: undefined,
    provinceId: undefined,
    departmentId: undefined,
  });

  const handleProvinceCoordinatesChange = useCallback((coords: { lat: number; lng: number } | null) => {
    if (coords) {
      setCenter(coords);
      localStorage.setItem("lastMapCenter", JSON.stringify(coords));
    }
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

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
      const result = await getProfessionalsAction({
        lat: center.lat,
        lng: center.lng,
        radius: 20,
        public_trade: "true",
        name: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
        province_id: filters.provinceId || undefined,
        department_id: filters.departmentId || undefined,
        has_promotions: true,
      });
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
          coordinates: {
            lat: Number(address?.latitude || 0),
            lng: Number(address?.longitude || 0),
          },
          icon: createCustomIcon(avatar, hasPromotions),
        };
      })
      .filter((p: any) => p.coordinates.lat !== 0 && p.coordinates.lng !== 0);
  }, [professionals]);

  useEffect(() => {
    // If a province filter is active, do not auto-center on the first professional
    if (filters.provinceId) return;

    const firstProfessional = mappedProfessionals[0];
    if (!firstProfessional) return;

    const nextCenter = firstProfessional.coordinates;
    if (nextCenter.lat === center.lat && nextCenter.lng === center.lng) {
      return;
    }

    setCenter(nextCenter);
  }, [mappedProfessionals, center.lat, center.lng, filters.provinceId]);

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
            <MapUpdater center={center} isCollapsed={isSidebarCollapsed} />

            {/* TileLayer Claro y Premium (CartoDB Positron) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
                            router.push(`${prof.profileUrl}?view=promotions`);
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
    </div>
  );
}
