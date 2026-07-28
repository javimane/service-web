import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ProductDetailPage from "@/views/Products/ProductDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/productos/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  try {
    const res = await fetch(
      API_ENDPOINTS.products.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const product = data?.data ?? data;
      const name = product?.Product?.name ?? product?.name ?? "Producto";
      const description =
        product?.Product?.description ??
        product?.description ??
        `Encontrá ${name} en Sercio. Consultá precios y disponibilidad.`;
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
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/productos/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  let jsonLd: any = null;
  let productData: any = null;

  try {
    const res = await fetch(
      API_ENDPOINTS.products.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      productData = data?.data ?? data;
      const name = productData?.Product?.name ?? productData?.name;
      const description = productData?.Product?.description ?? productData?.description;
      const image = productData?.Product?.image_url ?? productData?.image_url;
      const price = productData?.Product?.price ?? productData?.price;

      if (name) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": name,
          "description": description || `Producto ${name} disponible en Sercio.`,
          "image": image || undefined,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "ARS",
            "price": price || undefined,
            "availability": "https://schema.org/InStock",
            "url": `https://sercio.com.ar${fullPath}`,
          },
        };
      }
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailPage initialData={productData} />
    </>
  );
}
