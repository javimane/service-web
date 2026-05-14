import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ProductDetailPage from "@/views/Products/ProductDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  try {
    const res = await fetch(
      API_ENDPOINTS.products.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const product = data?.data ?? data;
      const name = product?.Product?.name ?? product?.name ?? "Producto";
      const image = product?.Product?.image_url ?? product?.image_url;
      return {
        title: name,
        description: product?.Product?.description ?? `Ver detalles de ${name}`,
        openGraph: {
          title: name,
          images: image ? [{ url: image }] : [],
        },
      };
    }
  } catch {}
  return { title: "Producto" };
}

export default function Page() {
  return <ProductDetailPage />;
}
