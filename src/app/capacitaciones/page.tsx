import type { Metadata } from "next";
import TrainingPage from "@/views/Training/TrainingPage";

export const metadata: Metadata = {
  title: "Capacitaciones para comercios y profesionales | Sercio",
  description: "Guías paso a paso para crear tu cuenta y usar el panel de Sercio.",
};

export default function Page() {
  return <TrainingPage />;
}
