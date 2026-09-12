import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import { fetchWithApiKey } from "@/lib/serverFetch";
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
    const res = await fetchWithApiKey(API_ENDPOINTS.professionals.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const professional = data?.data ?? data;
      const company =
        professional?.Companies?.[0] ||
        professional?.Company?.[0] ||
        professional?.companies?.[0];
      const name =
        company?.name?.trim() ||
        professional?.Profile?.display_name?.trim() ||
        "Profesional";
      const avatar = professional?.Profile?.avatar_url;

      const categories = professional?.professional_categories
        ?.map((pc: any) => pc.Category?.name)
        .filter(Boolean)
        .join(", ");

      const addresses = Array.isArray(professional?.address)
        ? professional.address
        : Array.isArray(professional?.Address)
          ? professional.Address
          : company?.Address
            ? [company.Address]
            : [];
      const mainAddress =
        addresses.find((a: any) => a?.is_main_address) || addresses[0];
      const location =
        mainAddress?.Department?.name || mainAddress?.Province?.name || "";

      const titleCategory = categories
        ? categories.split(",").slice(0, 2).join(" y ")
        : "Servicios Profesionales";
      const title = `${name} | ${titleCategory}${location ? ` en ${location}` : ""} - Sercio`;

      const description =
        company?.description ||
        professional?.bio ||
        `Contactá a ${name}${categories ? `, especialistas en ${categories}` : ""}${location ? ` en ${location}` : ""}. Consultá servicios, trabajos realizados, opiniones y datos de contacto en Sercio.`;

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
    const res = await fetchWithApiKey(API_ENDPOINTS.professionals.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      profData = data?.data ?? data;
      const company =
        profData?.Companies?.[0] ||
        profData?.Company?.[0] ||
        profData?.companies?.[0];
      const name =
        company?.name?.trim() ||
        profData?.Profile?.display_name?.trim() ||
        "Profesional";
      const avatar = profData?.Profile?.avatar_url;

      const categories = profData?.professional_categories
        ?.map((pc: any) => pc.Category?.name)
        .filter(Boolean)
        .join(", ");

      const addresses = Array.isArray(profData?.address)
        ? profData.address
        : Array.isArray(profData?.Address)
          ? profData.Address
          : company?.Address
            ? [company.Address]
            : [];
      const addressObj =
        addresses.find((a: any) => a?.is_main_address) || addresses[0];

      const location =
        addressObj?.Department?.name || addressObj?.Province?.name || "";

      const description =
        company?.description ||
        profData?.bio ||
        `Perfil profesional de ${name} en Sercio${categories ? `. Especialidad: ${categories}` : ""}${location ? ` en ${location}` : ""}.`;

      const rating = Number(profData?.rating_avg || 0);
      const reviewsCount = Number(profData?.reviews_count || 0);

      if (name) {
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: name,
          description: description,
          url: `https://sercio.com.ar/perfil/${seoPath.join("/")}`,
          image: avatar || undefined,
          knowsAbout: categories ? categories.split(", ") : undefined,
          address: addressObj
            ? {
                "@type": "PostalAddress",
                streetAddress:
                  `${addressObj.street_name || ""} ${addressObj.street_number || ""}`.trim() ||
                  undefined,
                addressLocality: addressObj.Department?.name || undefined,
                addressRegion: addressObj.Province?.name || undefined,
                postalCode: addressObj.zip_code || undefined,
                addressCountry: "AR",
              }
            : undefined,
          ...(rating > 0 && reviewsCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: rating.toFixed(1),
                  reviewCount: reviewsCount,
                },
              }
            : {}),
          ...(profData?.web_url ? { sameAs: [profData.web_url] } : {}),
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
