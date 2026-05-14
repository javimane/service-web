import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ServiceDetailPage from "@/views/Services/ServiceDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  try {
    const res = await fetch(
      API_ENDPOINTS.services.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const service = data?.data ?? data;
      const name = service?.title ?? service?.name ?? "Servicio";
      const image = service?.image_url;
      return {
        title: name,
        description: service?.description ?? `Ver detalles de ${name}`,
        openGraph: {
          title: name,
          images: image ? [{ url: image }] : [],
        },
      };
    }
  } catch {}
  return { title: "Servicio" };
}

export default function Page() {
  return <ServiceDetailPage />;
}
