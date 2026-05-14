"use client";
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { X, MapPin, Check, Navigation, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./MapPickerModal.css";

// Fix for Leaflet default icon issues in Vite/React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const defaultCenter: [number, number] = [-34.6037, -58.3816];

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

// Sub-component to handle map clicks
function LocationMarker({
  pos,
  setPos,
}: {
  pos: [number, number] | null;
  setPos: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
    },
  });

  return pos === null ? null : <Marker position={pos} />;
}

// Sub-component to pan the map programmatically
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function MapPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialLat,
  initialLng,
}: MapPickerModalProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      const pos: [number, number] = [initialLat, initialLng];
      setMarkerPos(pos);
      setMapCenter(pos);
    } else {
      setMarkerPos(null);
      setMapCenter(defaultCenter);
    }
  }, [initialLat, initialLng, isOpen]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos: [number, number] = [latitude, longitude];
        setMarkerPos(newPos);
        setMapCenter(newPos);
        setLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "No se pudo obtener tu ubicación. Por favor, verificá los permisos de tu navegador.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const handleConfirm = () => {
    if (markerPos) {
      onSelect(markerPos[0], markerPos[1]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="map-picker-overlay">
      <div className="map-picker-modal">
        <div className="map-picker-header">
          <div className="map-picker-title">
            <MapPin size={20} />
            <h3>Ubicación del comercio</h3>
          </div>
          <div className="map-picker-header-actions">
            <button
              className={`map-location-btn ${locating ? "locating" : ""}`}
              onClick={handleGetCurrentLocation}
              disabled={locating}
              title="Usar mi ubicación actual"
            >
              {locating ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Navigation size={18} />
              )}
              <span>{locating ? "Ubicando..." : "Mi ubicación"}</span>
            </button>
            <button className="map-picker-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="map-picker-body">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker pos={markerPos} setPos={setMarkerPos} />
            <MapController center={mapCenter} />
          </MapContainer>
        </div>

        <div className="map-picker-footer">
          <p className="map-picker-hint">
            Hacé click en el mapa para colocar el pin en la ubicación exacta.
          </p>
          <div className="map-picker-actions">
            <button
              className="map-picker-btn map-picker-btn--secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="map-picker-btn map-picker-btn--primary"
              onClick={handleConfirm}
              disabled={!markerPos}
            >
              <Check size={18} />
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
