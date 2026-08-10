import { Suspense } from "react";
import type { Metadata } from "next";
import ReelsPage from "@/views/Reels/ReelsPage";

export const metadata: Metadata = {
  title: "Reels y Videos de Servicios - Sercio",
  description:
    "Mirá los últimos reels, trabajos en vivo y videos explicativos de nuestros profesionales y comercios.",
  alternates: {
    canonical: "https://sercio.com.ar/reels",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReelsPage />
    </Suspense>
  );
}