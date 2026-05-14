import type { Metadata } from "next";
import MapPage from "@/views/Map/MapPage";

export const metadata: Metadata = {
  title: "Mapa de Profesionales - TuApp",
  description:
    "Ubicá profesionales cercanos en el mapa y filtrá por rubro, provincia y ciudad.",
};

export default function Page() {
  return <MapPage />;
}
