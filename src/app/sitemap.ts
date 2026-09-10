import { MetadataRoute } from "next";
import { getApiKey } from "@/lib/serverFetch";

// Revalidar el sitemap cada hora para que siempre tenga contenido actualizado
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sercio.com.ar";
  const configuredApiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  // En producción, si la URL no está definida o apunta a localhost, usar la API pública oficial
  const apiUrl =
    configuredApiUrl && !configuredApiUrl.includes("localhost")
      ? configuredApiUrl
      : process.env.NODE_ENV === "production"
        ? "https://api.sercio.com.ar"
        : configuredApiUrl || "http://localhost:3000";

  const apiKey = getApiKey();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/busqueda",
    "/categorias",
    "/empleos",
    "/mapa",
    "/productos",
    "/promociones",
    "/publicaciones",
    "/reels",
    "/servicios",
    "/preguntas-frecuentes",
    "/privacidad",
    "/terminos",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const response = await fetch(`${apiUrl}/api/seo/paths`, {
      headers: {
        "x-api-key": apiKey,
      },
      next: { revalidate: 3600 }, // Cache by 1 hour
    });

    if (response.ok) {
      const dynamicPaths = await response.json();

      const dynamicRoutes: MetadataRoute.Sitemap = dynamicPaths.map(
        (item: any) => ({
          url: `${baseUrl}${item.url}`,
          lastModified:
            item.updated_at || item.lastModified
              ? new Date(item.updated_at || item.lastModified)
              : new Date(),
          changeFrequency: item.changeFrequency || "weekly",
          priority: item.priority || 0.8,
        }),
      );

      return [...staticRoutes, ...dynamicRoutes];
    }
  } catch (error) {
    console.error("Error fetching dynamic sitemap paths:", error);
  }

  return staticRoutes;
}
