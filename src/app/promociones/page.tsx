import { Suspense } from "react";
import type { Metadata } from "next";
import PromotionsPage from "@/views/Promotions/PromotionsPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promociones y Descuentos - Sercio",
  description:
    "Descubrí las mejores ofertas, promociones bancarias y descuentos en productos y servicios cerca tuyo.",
  alternates: {
    canonical: "https://sercio.com.ar/promociones",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PromotionsPage />
    </Suspense>
  );
}
