import { Suspense } from "react";
import type { Metadata } from "next";
import MapPageWrapper from "@/views/Map/MapPageWrapper";

export const metadata: Metadata = {
  title: "Mapa de Profesionales - Sercio",
  description:
    "Ubicá profesionales cercanos en el mapa y filtrá por rubro, provincia y ciudad.",
};

export default function Page() {
  return (
    <Suspense
      fallback={<div className="map-placeholder">Cargando mapa...</div>}
    >
      <MapPageWrapper />
    </Suspense>
  );
}
