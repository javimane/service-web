import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sercio.com.ar";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.sercio.com.ar";

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
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
      },
      next: { revalidate: 3600 }, // Cache by 1 hour
    });
    
    if (response.ok) {
      const dynamicPaths = await response.json();
      
      const dynamicRoutes: MetadataRoute.Sitemap = dynamicPaths.map((item: any) => ({
        url: `${baseUrl}${item.url}`,
        lastModified: new Date(),
        changeFrequency: item.changeFrequency || "weekly",
        priority: item.priority || 0.8,
      }));

      return [...staticRoutes, ...dynamicRoutes];
    }
  } catch (error) {
    console.error("Error fetching dynamic sitemap paths:", error);
  }

  return staticRoutes;
}
