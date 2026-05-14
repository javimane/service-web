import type { Metadata } from "next";
import ProductsPage from "@/views/Products/ProductsPage";

export const metadata: Metadata = {
  title: "Catálogo de Productos - TuApp",
  description:
    "Explorá el catálogo de productos profesionales con filtros por categoría, precio y ubicación.",
};

export default function Page() {
  return <ProductsPage />;
}
