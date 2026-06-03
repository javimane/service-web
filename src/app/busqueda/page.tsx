import type { Metadata } from "next";
import { Suspense } from "react";
import SearchResultsPage from "../../views/Search/SearchResultsPage";

export const metadata: Metadata = {
  title: "Resultados de búsqueda - Sercio",
  description: "Encontrá profesionales, servicios, productos y promociones en Sercio.",
};

export default function BusquedaPage() {
  return (
    <Suspense>
      <SearchResultsPage />
    </Suspense>
  );
}
