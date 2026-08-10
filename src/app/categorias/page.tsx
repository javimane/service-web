import { Suspense } from "react";
import type { Metadata } from "next";
import CategoriesPage from "@/views/Categories/CategoriesPage";

export const metadata: Metadata = {
  title: "Categorías y Especialistas - Sercio",
  description:
    "Explorá categorías, filtrá especialistas por ubicación y encontrá profesionales verificados.",
  alternates: {
    canonical: "https://sercio.com.ar/categorias",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CategoriesPage />
    </Suspense>
  );
}
