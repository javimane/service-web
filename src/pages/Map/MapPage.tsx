import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Navbar from '../../components/Navbar/Navbar';
import MapSidebar from './MapSidebar';
import { professionals } from '../../data/specialists';
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
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [filteredProfessionals, setFilteredProfessionals] = useState(professionals);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

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

  return (
    <div className="map-page">
      <Navbar />
      
      <main className="map-page__container">
        <MapSidebar 
          onFilterChange={setFilteredProfessionals} 
          specialistsCount={filteredProfessionals.length}
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
              {filteredProfessionals.map((prof) => (
                <Marker
                  key={prof.id}
                  position={prof.coordinates || defaultCenter}
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
                        <span>★ {selectedProfessional.rating}</span>
                        <span className="badge">EXPERT</span>
                      </div>
                      <button className="map-info-window__btn">View Profile</button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="map-placeholder">Loading Map...</div>
          )}
        </div>
      </main>
    </div>
  );
}
