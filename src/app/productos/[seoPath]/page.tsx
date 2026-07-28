import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ProductDetailPage from "@/views/Products/ProductDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const id = seoPath.split("-")[0];
  const fullPath = `/productos/${seoPath}`;
  try {
    const res = await fetch(API_ENDPOINTS.products.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const product = data?.data ?? data;
      const name = product?.Product?.name ?? product?.name ?? "Producto";
      const description =
        product?.Product?.description ??
        product?.description ??
        `Encontrá ${name} en Sercio.`;
      const image = product?.Product?.image_url ?? product?.image_url;

      return {
        title: `${name} - Productos en Sercio`,
        description,
        alternates: {
          canonical: `https://sercio.com.ar${fullPath}`,
        },
        openGraph: {
          title: `${name} - Sercio`,
          description,
          url: `https://sercio.com.ar${fullPath}`,
          siteName: "Sercio",
          images: image ? [{ url: image }] : [],
        },
      };
    }
  } catch {}
  return { title: "Producto - Sercio" };
}

export default async function Page({ params }: Props) {
  const { seoPath } = await params;
  const id = seoPath.split("-")[0];
  let productData: any = null;

  try {
    const res = await fetch(API_ENDPOINTS.products.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      productData = data?.data ?? data;
    }
  } catch {}

  return <ProductDetailPage initialData={productData} />;
}
