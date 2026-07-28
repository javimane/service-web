import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ProfilePage from "@/views/Profile/ProfilePage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const id = seoPath.split("-")[0];
  const fullPath = `/perfil/${seoPath}`;
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
        `Perfil profesional de ${name} en Sercio. Conocé sus servicios, productos y promociones.`;

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
  const id = seoPath.split("-")[0];
  let profData: any = null;

  try {
    const res = await fetch(API_ENDPOINTS.professionals.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      profData = data?.data ?? data;
    }
  } catch {}

  return <ProfilePage initialData={profData} />;
}
