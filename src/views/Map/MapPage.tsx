"use client";
import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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

// Componente para actualizar el centro del mapa cuando cambia
function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 13, { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

// Crear un icono personalizado con foto de perfil y efecto de pulso
const createCustomIcon = (avatarUrl: string) => {
  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div class="custom-map-marker__pin">
        <img src="${avatarUrl}" alt="avatar" />
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

  // Request location permission
  useEffect(() => {
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
      });
      return result?.data ?? [];
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
          company?.name || profile?.display_name || p.name || "Profesional";

        const seoPath = p.seo_path || p.seoPath || null;
        const profileUrl = seoPath
          ? `${ROUTES.profile}${seoPath.startsWith("/") ? seoPath : `/${seoPath}`}`
          : `${ROUTES.profile}/${p.id}`;

        return {
          id: p.user_id || p.id,
          name,
          companyName: company?.name || "Sin empresa",
          specialty: p.specialty || p.bio || "Servicios",
          rating: p.ratingAvg || p.rating_avg || 0,
          isVerified,
          avatar,
          seoPath,
          profileUrl,
          coordinates: {
            lat: Number(address?.latitude || 0),
            lng: Number(address?.longitude || 0),
          },
          icon: createCustomIcon(avatar),
        };
      })
      .filter((p: any) => p.coordinates.lat !== 0 && p.coordinates.lng !== 0);
  }, [professionals]);

  useEffect(() => {
    const firstProfessional = mappedProfessionals[0];
    if (!firstProfessional) return;

    const nextCenter = firstProfessional.coordinates;
    if (nextCenter.lat === center.lat && nextCenter.lng === center.lng) {
      return;
    }

    setCenter(nextCenter);
  }, [mappedProfessionals, center.lat, center.lng]);

  return (
    <div className="map-page">
      <Navbar />

      <main className="map-page__container">
        <MapSidebar
          onFilterChange={(newFilters) =>
            setFilters((prev) => ({ ...prev, ...newFilters }))
          }
          specialistsCount={mappedProfessionals.length}
          isLoading={isLoading}
        />

        <div className="map-page__map-wrapper">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={13}
            style={{ width: "100%", height: "100%", zIndex: 1 }}
            zoomControl={false}
          >
            <MapUpdater center={center} />

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
