import type { Metadata } from "next";
import FAQPage from "../../views/FAQ/FAQPage";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes - Sercio",
  description:
    "Resolvé tus dudas sobre cómo publicar servicios, contratar profesionales y usar la plataforma Sercio.",
  alternates: {
    canonical: "https://sercio.com.ar/preguntas-frecuentes",
  },
};

export default function Page() {
  return <FAQPage />;
}
