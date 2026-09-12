import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import { fetchWithApiKey } from "@/lib/serverFetch";
import { extractIdFromSlug } from "@/utils/utils";
import ProductDetailPage from "@/views/Products/ProductDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const id = extractIdFromSlug(seoPath) || seoPath.split("-")[0];
  const fullPath = `/productos/${seoPath}`;
  try {
    const res = await fetchWithApiKey(API_ENDPOINTS.products.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const product = data?.data ?? data;
      const name = product?.Product?.name ?? product?.name ?? "Producto";
      const brand = product?.brand || product?.Brand?.name;
      const category =
        product?.Category?.name ||
        product?.categories_products?.name ||
        product?.SubCategory?.name;
      const professionalProduct = product?.ProfessionalProducts?.[0];
      const seller =
        professionalProduct?.Professional?.Company?.[0]?.name ||
        professionalProduct?.Professional?.Profile?.display_name;
      const price = professionalProduct?.price || product?.price;
      const province =
        professionalProduct?.Professional?.address?.[0]?.Province?.name;
      const image =
        product?.Images?.[0]?.image_url ||
        product?.Product?.image_url ||
        product?.image_url;

      const titleCategory = category ? ` | ${category}` : "";
      const titleProvince = province ? ` en ${province}` : "";
      const titleSeller = seller ? ` - ${seller}` : "";
      const title = `${name}${brand ? ` ${brand}` : ""}${titleCategory}${titleProvince}${titleSeller} - Sercio`;

      const formattedPrice =
        price && Number(price) > 0
          ? ` por $${Number(price).toLocaleString("es-AR")}`
          : "";
      const description =
        product?.Product?.description ||
        product?.description ||
        `Comprá ${name}${brand ? ` de ${brand}` : ""}${seller ? ` en ${seller}` : ""}${province ? ` (${province})` : ""}${formattedPrice}. Encontralo en Sercio con disponibilidad y medios de pago directos.`;

      return {
        title,
        description,
        alternates: {
          canonical: `https://sercio.com.ar${fullPath}`,
        },
        openGraph: {
          title,
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
  const id = extractIdFromSlug(seoPath) || seoPath.split("-")[0];
  const fullPath = `/productos/${seoPath}`;
  let jsonLd: any = null;
  let productData: any = null;

  try {
    const res = await fetchWithApiKey(API_ENDPOINTS.products.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      productData = data?.data ?? data;
      const name = productData?.Product?.name ?? productData?.name;
      const brand = productData?.brand || productData?.Brand?.name;
      const category =
        productData?.Category?.name ||
        productData?.categories_products?.name ||
        productData?.SubCategory?.name;
      const professionalProduct = productData?.ProfessionalProducts?.[0];
      const seller =
        professionalProduct?.Professional?.Company?.[0]?.name ||
        professionalProduct?.Professional?.Profile?.display_name;
      const price = professionalProduct?.price || productData?.price;
      const province =
        professionalProduct?.Professional?.address?.[0]?.Province?.name;
      const image =
        productData?.Images?.[0]?.image_url ||
        productData?.Product?.image_url ||
        productData?.image_url;

      const formattedPrice =
        price && Number(price) > 0
          ? ` por $${Number(price).toLocaleString("es-AR")}`
          : "";
      const description =
        productData?.Product?.description ||
        productData?.description ||
        `Comprá ${name}${brand ? ` de ${brand}` : ""}${seller ? ` en ${seller}` : ""}${province ? ` (${province})` : ""}${formattedPrice}. Disponible en Sercio.`;

      if (name) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: name,
          description: description,
          image: image || undefined,
          category: category || undefined,
          ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
          offers: {
            "@type": "Offer",
            priceCurrency: "ARS",
            price: price && Number(price) > 0 ? Number(price) : undefined,
            availability: "https://schema.org/InStock",
            url: `https://sercio.com.ar${fullPath}`,
            ...(seller
              ? {
                  seller: {
                    "@type": "Organization",
                    name: seller,
                  },
                }
              : {}),
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
