import type { Metadata } from "next";
import PublicationsPage from "@/views/Publications/PublicationsPage";

export const metadata: Metadata = {
  title: "Publicaciones | Sercio",
  description: "Explorá todas las publicaciones de nuestros profesionales",
  alternates: {
    canonical: "https://sercio.com.ar/publicaciones",
  },
};

export default function PublicationsRoute() {
  return <PublicationsPage />;
}
