import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/paths';
import { professionalService } from '../../services/professionalService';
import Navbar from '../../components/Navbar/Navbar';
import MapSidebar from './MapSidebar';
import { Loader2, Star, User, ExternalLink } from 'lucide-react';
import './MapPage.css';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 72px)'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

// Custom dark map style
const mapOptions = {
  styles: [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ color: "#757575" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#181818" }],
    },
    {
      featureType: "road",
      elementType: "geometry.fill",
      stylers: [{ color: "#2c2c2c" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#000000" }],
    },
  ],
  disableDefaultUI: true,
  zoomControl: true,
};

export default function MapPage() {
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: undefined
  });

  // Request location permission
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
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
      categoryId: filters.categoryId || undefined
    }),
    enabled: !!center.lat && center.lat !== defaultCenter.lat
  });

  const mappedProfessionals = useMemo(() => {
    return professionals.map((p: any) => {
      // Find address with coordinates
      const address = p.Company?.Address || p.Addresses?.[0];
      
      return {
        id: p.id,
        name: p.Profile?.display_name || p.Company?.name || "Profesional",
        specialty: p.bio || "Servicios",
        rating: p.rating_avg || 5.0,
        avatar: p.Profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.Profile?.display_name || "P")}&background=random`,
        coordinates: {
          lat: Number(address?.latitude || 0),
          lng: Number(address?.longitude || 0)
        }
      };
    }).filter(p => p.coordinates.lat !== 0);
  }, [professionals]);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

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
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={13}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={mapOptions}
              onClick={() => setSelectedProfessional(null)}
            >
              {mappedProfessionals.map((prof) => (
                <Marker
                  key={prof.id}
                  position={prof.coordinates}
                  onClick={() => setSelectedProfessional(prof)}
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                    scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : null
                  }}
                />
              ))}

              {selectedProfessional && (
                <InfoWindow
                  position={selectedProfessional.coordinates}
                  onCloseClick={() => setSelectedProfessional(null)}
                >
                  <div className="map-info-window">
                    <img src={selectedProfessional.avatar} alt={selectedProfessional.name} />
                    <div className="map-info-window__content">
                      <h3>{selectedProfessional.name}</h3>
                      <p>{selectedProfessional.specialty}</p>
                      <div className="map-info-window__meta">
                        <span><Star size={12} fill="currentColor" /> {selectedProfessional.rating}</span>
                        <span className="badge">PÚBLICO</span>
                      </div>
                      <button 
                        className="map-info-window__btn"
                        onClick={() => navigate(ROUTES.profile)}
                      >
                        <User size={14} />
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="map-placeholder">
              <Loader2 className="animate-spin" size={32} />
              <span>Cargando Google Maps...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
