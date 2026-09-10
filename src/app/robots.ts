import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel/", "/configuracion/", "/api/"],
    },
    sitemap: "https://sercio.com.ar/sitemap.xml",
  };
}
