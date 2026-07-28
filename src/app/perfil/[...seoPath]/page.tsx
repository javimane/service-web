import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ProfilePage from "@/views/Profile/ProfilePage";
import ProfessionalStorePage from "@/views/ProfessionalStore/ProfessionalStorePage";

type Props = { params: Promise<{ seoPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;

  // If last segment is "tienda", skip metadata — redirect will handle it
  if (seoPath[seoPath.length - 1] === "tienda") {
    return { title: "Tienda" };
  }

  // seoPath is ["estudio-manesero-asoc", "37"] — the last segment is the professional ID
  const id = seoPath[seoPath.length - 1];
  const fullPath = `/perfil/${seoPath.join("/")}`;
  try {
    const res = await fetch(API_ENDPOINTS.professionals.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const professional = data?.data ?? data;
      const company = professional?.Company?.[0];
      const name =
        company?.name ??
        professional?.Profile?.display_name ??
        "Profesional";
      const avatar = professional?.Profile?.avatar_url;
      const description =
        company?.description ||
        `Perfil profesional de ${name} en Sercio. Consultá sus servicios, productos, ofertas y datos de contacto.`;

      return {
        title: `${name} - Perfil Profesional en Sercio`,
        description,
        alternates: {
          canonical: `https://sercio.com.ar${fullPath}`,
        },
        openGraph: {
          title: `${name} - Sercio`,
          description,
          url: `https://sercio.com.ar${fullPath}`,
          siteName: "Sercio",
          images: avatar ? [{ url: avatar }] : [],
          type: "profile",
        },
      };
    }
  } catch {}
  return { title: "Perfil Profesional - Sercio" };
}

export default async function Page({ params }: Props) {
  const { seoPath } = await params;

  // If the catch-all captured a "tienda" suffix (e.g. ["bodega-sa", "9", "tienda"]),
  // render the store in-place to keep the canonical SEO URL.
  if (seoPath[seoPath.length - 1] === "tienda") {
    return <ProfessionalStorePage />;
  }

  const id = seoPath[seoPath.length - 1];
  let jsonLd: any = null;
  let profData: any = null;

  try {
    const res = await fetch(API_ENDPOINTS.professionals.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      profData = data?.data ?? data;
      const company = profData?.Company?.[0];
      const name = company?.name ?? profData?.Profile?.display_name;
      const avatar = profData?.Profile?.avatar_url;
      const mainAddress = company?.address || company?.Address || profData?.address;
      const addressObj = Array.isArray(mainAddress) ? mainAddress[0] : mainAddress;

      if (name) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "name": name,
          "description":
            company?.description ||
            `Perfil profesional de ${name} en Sercio.`,
          "url": `https://sercio.com.ar/perfil/${seoPath.join("/")}`,
          "image": avatar || undefined,
          "address": addressObj
            ? {
                "@type": "PostalAddress",
                "streetAddress": `${addressObj.street_name || ""} ${addressObj.street_number || ""}`.trim() || undefined,
                "addressLocality": addressObj.Department?.name || undefined,
                "addressRegion": addressObj.Province?.name || undefined,
                "postalCode": addressObj.zip_code || undefined,
                "addressCountry": "AR",
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
      <ProfilePage initialData={profData} />
    </>
  );
}
