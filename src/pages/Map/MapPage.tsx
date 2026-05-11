import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/paths';
import { professionalService } from '../../services/professionalService';
import Navbar from '../../components/Navbar/Navbar';
import MapSidebar from './MapSidebar';
import { Star, User } from 'lucide-react';
import './MapPage.css';

const defaultCenter = {
  lat: -34.6037, // Buenos Aires
  lng: -58.3816
};

// Componente para actualizar el centro del mapa cuando cambia
function MapUpdater({ center }: { center: { lat: number, lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 13, { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

// Crear un icono personalizado con foto de perfil y efecto de pulso
const createCustomIcon = (avatarUrl: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="custom-map-marker__pin">
        <img src="${avatarUrl}" alt="avatar" />
      </div>
      <div class="custom-map-marker__pulse"></div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 46], // punto de anclaje en la base
    popupAnchor: [0, -50] // popup arriba del pin
  });
};

const getInitialCenter = () => {
  const saved = localStorage.getItem('lastMapCenter');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return defaultCenter;
};

export default function MapPage() {
  const navigate = useNavigate();

  const [center, setCenter] = useState(getInitialCenter);
  const [filters, setFilters] = useState<{
    search: string;
    categoryId?: string;
    provinceId?: string;
    departmentId?: string;
  }>({
    search: '',
    categoryId: undefined,
    provinceId: undefined,
    departmentId: undefined
  });

  // Request location permission
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCenter(newCenter);
          localStorage.setItem('lastMapCenter', JSON.stringify(newCenter));
        },
        () => {
          console.log("Location permission denied or error.");
        }
      );
    }
  }, []);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["map-professionals", center, filters],
    queryFn: () => professionalService.list({
      lat: center.lat,
      lng: center.lng,
      radius: 20,
      public_trade: true,
      name: filters.search || undefined,
      categoryId: filters.categoryId || undefined,
      province_id: filters.provinceId || undefined,
      department_id: filters.departmentId || undefined
    }),
    enabled: !!center.lat && center.lat !== defaultCenter.lat
  });

  const mappedProfessionals = useMemo(() => {
    return professionals.map((p: any) => {
      // Find address with coordinates
      const address = p.Company?.Address || p.Addresses?.[0];
      
      const avatar = p.Profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.Profile?.display_name || "P")}&background=random`;
      
      return {
        id: p.user_id || p.id,
        name: p.Profile?.display_name || p.Company?.name || "Profesional",
        specialty: p.bio || "Servicios",
        rating: p.rating_avg || 5.0,
        avatar,
        coordinates: {
          lat: Number(address?.latitude || 0),
          lng: Number(address?.longitude || 0)
        },
        icon: createCustomIcon(avatar)
      };
    }).filter((p: any) => p.coordinates.lat !== 0);
  }, [professionals]);

  return (
    <div className="map-page">
      <Navbar />
      
      <main className="map-page__container">
        <MapSidebar 
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
          specialistsCount={mappedProfessionals.length}
          isLoading={isLoading}
        />

        <div className="map-page__map-wrapper">
          <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={13} 
            style={{ width: '100%', height: '100%', zIndex: 1 }}
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
                      <p>{prof.specialty}</p>
                      <div className="map-info-window__meta">
                        <span><Star size={12} fill="currentColor" /> {prof.rating}</span>
                        <span className="badge">PÚBLICO</span>
                      </div>
                      <button 
                        className="map-info-window__btn"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`${ROUTES.profile}/${prof.id}`);
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
