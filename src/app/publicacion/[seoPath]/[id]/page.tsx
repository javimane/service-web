import { Metadata } from "next";
import { getPublicationByIdAction } from "@/app/actions/publications";
import PublicationPage from "@/views/Publication/PublicationPage";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seoPath: string; id: string }>;
}): Promise<Metadata> {
  const { seoPath, id } = await params;

  if (!id || typeof id !== "string") {
    return {
      title: "Publicación | Sercio",
    };
  }

  const { data: publication } = await getPublicationByIdAction({ id });

  if (!publication) {
    return {
      title: "Publicación no encontrada | Sercio",
    };
  }

  const companyName = publication.professional?.companies?.[0]?.name;
  const profileName = publication.professional?.profile?.display_name;
  const authorName = companyName || profileName || "Profesional";
  const province =
    publication.professional?.address?.[0]?.province?.name ||
    publication.professional?.address?.[0]?.Province?.name;

  const mainImage = publication.publication_images?.[0]?.image_url;
  const cleanDescription = (publication.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const title = `${publication.title} | ${authorName}${province ? ` (${province})` : ""} - Sercio`;
  const fullPath = `/publicacion/${seoPath}/${id}`;

  return {
    title,
    description: cleanDescription,
    alternates: {
      canonical: `https://sercio.com.ar${fullPath}`,
    },
    openGraph: {
      title,
      description: cleanDescription,
      url: `https://sercio.com.ar${fullPath}`,
      siteName: "Sercio",
      type: "article",
      publishedTime: publication.created_at,
      modifiedTime: publication.updated_at || publication.created_at,
      images: mainImage ? [mainImage] : [],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ seoPath: string; id: string }>;
}) {
  const { seoPath, id } = await params;

  if (!id || typeof id !== "string") {
    notFound();
  }

  const { data: publication, serverError } = await getPublicationByIdAction({
    id,
  });

  if (!publication || serverError) {
    notFound();
  }

  const companyName = publication.professional?.companies?.[0]?.name;
  const profileName = publication.professional?.profile?.display_name;
  const authorName = companyName || profileName || "Profesional";
  const mainImage = publication.publication_images?.[0]?.image_url;
  const cleanDescription = (publication.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 250);
  const fullPath = `/publicacion/${seoPath}/${id}`;

  const professionalSeo = publication.professional?.seo_path
    ? `/perfil${publication.professional.seo_path.startsWith("/") ? publication.professional.seo_path : `/${publication.professional.seo_path}`}`
    : `/perfil/${publication.professional_id || ""}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: publication.title,
    description: cleanDescription,
    ...(mainImage ? { image: [mainImage] } : {}),
    datePublished: publication.created_at,
    dateModified: publication.updated_at || publication.created_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://sercio.com.ar${fullPath}`,
    },
    author: {
      "@type": companyName ? "Organization" : "Person",
      name: authorName,
      url: `https://sercio.com.ar${professionalSeo}`,
      ...(publication.professional?.profile?.avatar_url
        ? { image: publication.professional.profile.avatar_url }
        : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Sercio",
      url: "https://sercio.com.ar",
      logo: {
        "@type": "ImageObject",
        url: "https://sercio.com.ar/icons/icon-512x512.png",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicationPage publication={publication} />
    </>
  );
}
