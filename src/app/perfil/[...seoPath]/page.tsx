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

  // seoPath is ["bodega-sa", "9"] — the last segment is the professional ID
  const id = seoPath[seoPath.length - 1];
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

export default async function Page({ params }: Props) {
  const { seoPath } = await params;

  // If the catch-all captured a "tienda" suffix (e.g. ["bodega-sa", "9", "tienda"]),
  // render the store in-place to keep the canonical SEO URL.
  if (seoPath[seoPath.length - 1] === "tienda") {
    return <ProfessionalStorePage />;
  }

  return <ProfilePage />;
}
