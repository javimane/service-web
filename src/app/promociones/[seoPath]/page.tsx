import type { Metadata } from "next";
import PromotionDetailPage from "@/views/Promotions/PromotionDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  // Use a generic title for now since we get the actual promotion details from the API in the component
  // using the ID from query parameters
  const title = seoPath
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: title || "Promoción",
    description: "Ver detalles de la promoción",
  };
}

export default function Page() {
  return <PromotionDetailPage />;
}
