import type { Metadata } from "next";
import BankPromotionDetailPage from "@/views/Promotions/BankPromotionDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  // Use a generic title for now since we get the actual bank promotion details from the API in the component
  // using the ID from query parameters
  const title = seoPath
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: title || "Promoción Bancaria",
    description: "Ver detalles de la promoción bancaria",
  };
}

export default function Page() {
  return <BankPromotionDetailPage />;
}
