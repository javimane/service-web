import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import PromotionDetailPage from "@/views/Promotions/PromotionDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const id = seoPath.split("-")[0];
  const fullPath = `/promociones/${seoPath}`;
  try {
    const res = await fetch(
      API_ENDPOINTS.professionalPromotions.detail(id),
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
  const id = seoPath.split("-")[0];
  let promoData: any = null;

  try {
    const res = await fetch(
      API_ENDPOINTS.professionalPromotions.detail(id),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      promoData = data?.data ?? data;
    }
  } catch {}

  return <PromotionDetailPage initialData={promoData} />;
}
