import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import Providers from "./providers";
import "@/index.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-primary",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f18f38",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sercio.com.ar"),
  title: {
    default: "Sercio - Red de Servicios y Comercio",
    template: "%s | Sercio",
  },
  description:
    "Encontrá profesionales, servicios, productos y promociones cerca tuyo. Compará precios, leé opiniones y contactá comercios locales de confianza.",
  keywords:
    "servicios, profesionales, productos, hogar, construcción, reparaciones, comercio, local, confianza, calidad, presupuesto, opiniones, historias, videos, reels, productores, servicio industriales",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    siteName: "Sercio",
    url: "https://sercio.com.ar",
    locale: "es_AR",
    title: "Sercio - Red de Servicios y Comercio",
    description:
      "Encontrá profesionales, servicios, productos y promociones cerca tuyo. Compará precios, leé opiniones y contactá comercios locales de confianza.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sercio - Red de Servicios y Comercio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@sercioar",
    title: "Sercio - Red de Servicios y Comercio",
    description:
      "Encontrá profesionales, servicios, productos y promociones cerca tuyo. Compará precios, leé opiniones y contactá comercios locales de confianza.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/tu-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/tu-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/tu-logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/tu-logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/tu-logo.png",
  },
  manifest: "/site.webmanifest",
  other: {
    "og:locale": "es_AR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://sercio.com.ar/#organization",
        name: "Sercio",
        url: "https://sercio.com.ar",
        logo: {
          "@type": "ImageObject",
          url: "https://sercio.com.ar/tu-logo.png",
        },
        sameAs: [],
        description:
          "Plataforma argentina de servicios y comercio local. Encontrá profesionales, productos y promociones cerca tuyo.",
      },
      {
        "@type": "WebSite",
        "@id": "https://sercio.com.ar/#website",
        url: "https://sercio.com.ar",
        name: "Sercio",
        description:
          "Encontrá profesionales, servicios, productos y promociones cerca tuyo.",
        publisher: { "@id": "https://sercio.com.ar/#organization" },
        inLanguage: "es-AR",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://sercio.com.ar/buscar?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="es" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
