import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import PromotionDetailPage from "@/views/Promotions/PromotionDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/promociones/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  try {
    const res = await fetch(
      API_ENDPOINTS.professionalPromotions.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const promo = data?.data ?? data;
      const title = promo?.title ?? promo?.name ?? "Promoción";
      const description =
        promo?.description ?? `Aprovechá la promoción ${title} en Sercio.`;
      const image = promo?.image_url;

      return {
        title: `${title} - Promociones en Sercio`,
        description,
        alternates: {
          canonical: `https://sercio.com.ar${fullPath}`,
        },
        openGraph: {
          title: `${title} - Sercio`,
          description,
          url: `https://sercio.com.ar${fullPath}`,
          siteName: "Sercio",
          images: image ? [{ url: image }] : [],
        },
      };
    }
  } catch {}
  return { title: "Promoción - Sercio" };
}

export default async function Page({ params }: Props) {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/promociones/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  let jsonLd: any = null;
  let promoData: any = null;

  try {
    const res = await fetch(
      API_ENDPOINTS.professionalPromotions.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      promoData = data?.data ?? data;
      const title = promoData?.title ?? promoData?.name;
      const description = promoData?.description;
      const image = promoData?.image_url;

      if (title) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Offer",
          "name": title,
          "description": description || `Promoción ${title} en Sercio.`,
          "image": image || undefined,
          "url": `https://sercio.com.ar${fullPath}`,
          "priceCurrency": "ARS",
          "availability": "https://schema.org/InStock",
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
      <PromotionDetailPage initialData={promoData} />
    </>
  );
}
