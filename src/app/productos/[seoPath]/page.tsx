import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { API_ENDPOINTS } from "@/services/api.config";
import { fetchWithApiKey } from "@/lib/serverFetch";
import { getCanonicalProductUrl, getMerchantProduct } from "@/lib/productMerchantData";
import { extractIdFromSlug, isUuid } from "@/utils/utils";
import ProductDetailPage from "@/views/Products/ProductDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

async function resolveProduct(seoPath: string) {
  const id = extractIdFromSlug(seoPath);

  if (id && isUuid(id)) {
    const res = await fetchWithApiKey(API_ENDPOINTS.products.detail(id), {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return { product: data?.data ?? data, redirectUrl: null };
    }
  }

  // If no UUID was in the path, try to resolve by name
  const queryName = seoPath.replace(/-/g, " ").trim();
  if (queryName) {
    try {
      const resName = await fetchWithApiKey(
        API_ENDPOINTS.products.byName(encodeURIComponent(queryName)),
        { next: { revalidate: 3600 } },
      );
      if (resName.ok) {
        const matches = await resName.json();
        const items = Array.isArray(matches) ? matches : (matches?.data ?? []);
        if (items.length > 0) {
          const match = items[0];
          const targetPath = match.seo_path
            ? `/productos${match.seo_path.startsWith("/") ? match.seo_path : `/${match.seo_path}`}`
            : `/productos/${match.name.toLowerCase().trim().replace(/\s+/g, "-")}/${match.id}`;
          return { product: null, redirectUrl: targetPath };
        }
      }
    } catch {}
  }

  return { product: null, redirectUrl: null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const fullPath = `/productos/${seoPath}`;

  try {
    const { product, redirectUrl } = await resolveProduct(seoPath);

    if (redirectUrl) {
      return {
        title: "Redirigiendo... | Sercio",
      };
    }

    if (product) {
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
      const merchantProduct = getMerchantProduct(product);
      const price = merchantProduct?.salePrice ?? merchantProduct?.price;
      const canonical = getCanonicalProductUrl(product, fullPath);
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
          canonical,
        },
        openGraph: {
          title,
          description,
          url: canonical,
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

  const { product: productData, redirectUrl } = await resolveProduct(seoPath);

  if (redirectUrl) {
    permanentRedirect(redirectUrl);
  }

  if (!productData) {
    permanentRedirect(
      `/productos?search=${encodeURIComponent(seoPath.replace(/-/g, " "))}`,
    );
  }

  const jsonLd = getMerchantProduct(productData)?.structuredData;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <ProductDetailPage initialData={productData} />
    </>
  );
}
