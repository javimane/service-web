import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import { fetchWithApiKey } from "@/lib/serverFetch";
import { extractIdFromSlug } from "@/utils/utils";
import ServiceDetailPage from "@/views/Services/ServiceDetailPage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const id =
    extractIdFromSlug(seoPath) ||
    (Array.isArray(seoPath) ? seoPath[seoPath.length - 1] : seoPath);
  const fullPath = `/servicios/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;

  try {
    const res = await fetchWithApiKey(API_ENDPOINTS.services.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const service = data?.data ?? data;
      const name = service?.title ?? service?.name ?? "Servicio";

      const professional = service?.professional || service?.Professional;
      const profile = professional?.profile || professional?.Profile;
      const company = professional?.companies?.[0] || professional?.Company;
      const providerName =
        company?.name || profile?.display_name || "Profesional";

      const address = professional?.address?.[0] || professional?.Address;
      const province = address?.province?.name || address?.Province?.name;
      const department = address?.department?.name || address?.Department?.name;
      const locationStr =
        [department, province].filter(Boolean).join(", ") || province || "";

      const basePrice = Number(service?.base_price ?? service?.price);
      const hasRealPrice = Number.isFinite(basePrice) && basePrice > 1;
      const formattedPrice = hasRealPrice
        ? ` por $${basePrice.toLocaleString("es-AR")}`
        : "";

      const title = `${name} | ${providerName}${locationStr ? ` en ${locationStr}` : ""} - Sercio`;
      const description =
        service?.description ||
        `Contratá ${name} de ${providerName}${locationStr ? ` en ${locationStr}` : ""}${formattedPrice}. Encontralo en Sercio con atención profesional y presupuestos online.`;
      const image = service?.image_url;

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
  return { title: "Servicio - Sercio" };
}

export default async function Page({ params }: Props) {
  const { seoPath } = await params;
  const id =
    extractIdFromSlug(seoPath) ||
    (Array.isArray(seoPath) ? seoPath[seoPath.length - 1] : seoPath);
  const fullPath = `/servicios/${Array.isArray(seoPath) ? seoPath.join("/") : seoPath}`;
  let jsonLd: any = null;
  let serviceData: any = null;

  try {
    const res = await fetchWithApiKey(API_ENDPOINTS.services.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      serviceData = data?.data ?? data;
      const name = serviceData?.title ?? serviceData?.name;
      const description =
        serviceData?.description || `Servicio ${name} en Sercio.`;
      const image = serviceData?.image_url;

      const professional =
        serviceData?.professional || serviceData?.Professional;
      const profile = professional?.profile || professional?.Profile;
      const company = professional?.companies?.[0] || professional?.Company;
      const providerName =
        company?.name || profile?.display_name || "Profesional";

      const address = professional?.address?.[0] || professional?.Address;
      const province = address?.province?.name || address?.Province?.name;
      const department = address?.department?.name || address?.Department?.name;
      const locationStr =
        [department, province].filter(Boolean).join(", ") || province || "";

      const basePrice = Number(serviceData?.base_price ?? serviceData?.price);
      const hasRealPrice = Number.isFinite(basePrice) && basePrice > 1;

      const profileSeo = professional?.seo_path
        ? `/perfil${professional.seo_path.startsWith("/") ? professional.seo_path : `/${professional.seo_path}`}`
        : `/perfil/${serviceData?.professional_id || ""}`;

      if (name) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Service",
          name,
          description,
          url: `https://sercio.com.ar${fullPath}`,
          provider: {
            "@type": company?.name ? "Organization" : "Person",
            name: providerName,
            url: `https://sercio.com.ar${profileSeo}`,
            ...(profile?.avatar_url ? { image: profile.avatar_url } : {}),
          },
          ...(image ? { image } : {}),
          ...(locationStr
            ? {
                areaServed: {
                  "@type": "AdministrativeArea",
                  name: locationStr,
                },
              }
            : {}),
          ...(hasRealPrice
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "ARS",
                  price: basePrice,
                  availability: "https://schema.org/InStock",
                  url: `https://sercio.com.ar${fullPath}`,
                },
              }
            : {}),
          ...(professional?.rating_avg && Number(professional.rating_avg) > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: Number(professional.rating_avg),
                  bestRating: 5,
                  worstRating: 1,
                  ratingCount: professional.reviews_count || 1,
                },
              }
            : {}),
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
      <ServiceDetailPage initialData={serviceData} />
    </>
  );
}
