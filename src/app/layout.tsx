import type { Metadata } from "next";
import Providers from "./providers";
import "@/index.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3003"),
  title: {
    default: "TuApp - Servicios Profesionales y Productos",
    template: "%s | TuApp",
  },
  description:
    "Encontrá a los mejores profesionales y productos en un solo lugar. Servicios de plomería, gas, diseño y más.",
  keywords:
    "servicios, profesionales, productos, hogar, construcción, reparaciones",
  openGraph: {
    type: "website",
    siteName: "TuApp",
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
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
