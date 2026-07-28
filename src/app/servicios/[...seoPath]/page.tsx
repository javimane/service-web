import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ServiceDetailPage from "@/views/Services/ServiceDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/servicios/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  try {
    const res = await fetch(
      API_ENDPOINTS.services.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const service = data?.data ?? data;
      const name = service?.title ?? service?.name ?? "Servicio";
      const description =
        service?.description ??
        `Contratá ${name} en Sercio. Consultá precios, opiniones y disponibilidad.`;
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
  const pathString = Array.isArray(seoPath) ? seoPath[0] : seoPath;
  const fullPath = `/servicios/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  let jsonLd: any = null;

  try {
    const res = await fetch(
      API_ENDPOINTS.services.detail(pathString.split("-")[0]),
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const service = data?.data ?? data;
      const name = service?.title ?? service?.name;
      const description = service?.description;
      const image = service?.image_url;
      const price = service?.base_price ?? service?.price;

      if (name) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": name,
          "description": description || `Servicio ${name} en Sercio.`,
          "image": image || undefined,
          "url": `https://sercio.com.ar${fullPath}`,
          "offers": price
            ? {
                "@type": "Offer",
                "priceCurrency": "ARS",
                "price": price,
                "availability": "https://schema.org/InStock",
              }
            : undefined,
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
      <ServiceDetailPage />
    </>
  );
}
