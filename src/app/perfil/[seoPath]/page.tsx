import type { Metadata } from "next";
import { API_ENDPOINTS } from "@/services/api.config";
import ProfilePage from "@/views/Profile/ProfilePage";

type Props = { params: Promise<{ seoPath: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath } = await params;
  const id = seoPath.split("-")[0];
  try {
    const res = await fetch(API_ENDPOINTS.professionals.detail(id), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const professional = data?.data ?? data;
      const name =
        professional?.Company?.[0]?.name ??
        professional?.Profile?.display_name ??
        "Profesional";
      const avatar = professional?.Profile?.avatar_url;
      return {
        title: name,
        description: `Perfil de ${name} en TuApp. Conocé sus servicios, productos y promociones.`,
        openGraph: {
          title: name,
          images: avatar ? [{ url: avatar }] : [],
        },
      };
    }
  } catch {}
  return { title: "Perfil Profesional" };
}

export default function Page() {
  return <ProfilePage />;
}
