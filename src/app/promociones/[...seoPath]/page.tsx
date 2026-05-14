import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import PromotionDetailPage from "@/views/Promotions/PromotionDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  try {
    const res = await fetch(
      API_ENDPOINTS.professionalPromotions.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const promo = data?.data ?? data;
      const title = promo?.title ?? promo?.name ?? "Promoción";
      const image = promo?.image_url;
      return {
        title,
        description:
          promo?.description ?? `Ver detalles de la promoción ${title}`,
        openGraph: {
          title,
          images: image ? [{ url: image }] : [],
        },
      };
    }
  } catch {}
  return { title: "Promoción" };
}

export default function Page() {
  return <PromotionDetailPage />;
}
