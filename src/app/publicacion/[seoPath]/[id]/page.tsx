import { Metadata } from "next";
import { getPublicationByIdAction } from "@/app/actions/publications";
import PublicationPage from "@/views/Publication/PublicationPage";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seoPath: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

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

  const mainImage = publication.publication_images?.[0]?.image_url;

  return {
    title: `${publication.title} | Sercio`,
    description: publication.description.substring(0, 160),
    openGraph: {
      title: publication.title,
      description: publication.description.substring(0, 160),
      images: mainImage ? [mainImage] : [],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ seoPath: string; id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    notFound();
  }

  const { data: publication, serverError } = await getPublicationByIdAction({ id });

  if (!publication || serverError) {
    notFound();
  }

  return <PublicationPage publication={publication} />;
}
