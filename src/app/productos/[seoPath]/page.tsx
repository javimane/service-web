import type { Metadata } from "next";
import ProductDetailPage from "@/views/Products/ProductDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  // Use a generic title for now since we get the actual product details from the API in the component
  // using the ID from query parameters
  const title = seoPath
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: title || "Producto",
    description: "Ver detalles del producto",
  };
}

export default function Page() {
  return <ProductDetailPage />;
}
