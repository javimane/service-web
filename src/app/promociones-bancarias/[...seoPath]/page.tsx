import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import BankPromotionDetailPage from "@/views/Promotions/BankPromotionDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/promociones-bancarias/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  try {
    const res = await fetch(
      API_ENDPOINTS.bankPromotions.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const promo = data?.data ?? data;
      const companyName = promo?.Professional?.Company?.[0]?.name ?? "Comercio";
      const discount = promo?.percentaje_discount
        ? `${promo.percentaje_discount}% de descuento`
        : "Promoción bancaria";
      const title = `${discount} en ${companyName}`;
      const description =
        promo?.description ??
        `Aprovechá ${discount} en ${companyName} pagando con bancos adheridos en Sercio.`;

      return {
        title: `${title} - Promociones Bancarias en Sercio`,
        description,
        alternates: {
          canonical: `https://sercio.com.ar${fullPath}`,
        },
        openGraph: {
          title: `${title} - Sercio`,
          description,
          url: `https://sercio.com.ar${fullPath}`,
          siteName: "Sercio",
        },
      };
    }
  } catch {}
  return { title: "Promoción Bancaria - Sercio" };
}

export default async function Page({ params }: Props) {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/promociones-bancarias/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  let jsonLd: any = null;

  try {
    const res = await fetch(
      API_ENDPOINTS.bankPromotions.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const promo = data?.data ?? data;
      const companyName = promo?.Professional?.Company?.[0]?.name ?? "Comercio";
      const discount = promo?.percentaje_discount
        ? `${promo.percentaje_discount}% de descuento`
        : "Promoción bancaria";
      const title = `${discount} en ${companyName}`;
      const description = promo?.description;

      if (title) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Offer",
          "name": title,
          "description":
            description || `Descuento bancario en ${companyName} con Sercio.`,
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
      <BankPromotionDetailPage />
    </>
  );
}
