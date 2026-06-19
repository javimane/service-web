import type { Metadata } from "next";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3003"),
  title: {
    default: "Sercio - Red de Servicios y Comercio",
    template: "%s | Sercio",
  },
  description:
    "Encontrá a los mejores profesionales y productos en un solo lugar.",
  keywords:
    "servicios, profesionales, productos, hogar, construcción, reparaciones, comercio, local, confianza, calidad, presupuesto, opiniones",
  openGraph: {
    type: "website",
    siteName: "Sercio",
    images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
