import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import BankPromotionDetailPage from "@/views/Promotions/BankPromotionDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
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
      return {
        title: `${discount} en ${companyName}`,
        description:
          promo?.description ?? `Aprovechá ${discount} en ${companyName}`,
        openGraph: {
          title: `${discount} en ${companyName}`,
        },
      };
    }
  } catch {}
  return { title: "Promoción Bancaria" };
}

export default function Page() {
  return <BankPromotionDetailPage />;
}
