import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ServiceDetailPage from "@/views/Services/ServiceDetailPage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const id = seoPath.split("-")[0];
  const fullPath = `/servicios/${seoPath}`;
  try {
    const res = await fetch(
      API_ENDPOINTS.services.detail(id),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const service = data?.data ?? data;
      const name = service?.title ?? service?.name ?? "Servicio";
      const description =
        service?.description ?? `Contratá ${name} en Sercio.`;
      const image = service?.image_url;

      return {
        title: `${name} - Servicios en Sercio`,
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
  return { title: "Servicio - Sercio" };
}

export default async function Page({ params }: Props) {
  const { seoPath } = await params;
  const id = seoPath.split("-")[0];
  let serviceData: any = null;

  try {
    const res = await fetch(
      API_ENDPOINTS.services.detail(id),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      serviceData = data?.data ?? data;
    }
  } catch {}

  return <ServiceDetailPage initialData={serviceData} />;
}
