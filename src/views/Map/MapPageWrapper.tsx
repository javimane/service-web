"use client";

import dynamic from "next/dynamic";
import "./MapPage.css";

const MapPage = dynamic(() => import("./MapPage"), {
  ssr: false,
  loading: () => <div className="map-placeholder">Cargando mapa...</div>,
});

export default function MapPageWrapper() {
  return <MapPage />;
}
