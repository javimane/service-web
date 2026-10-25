import type { Metadata } from "next";
import RiderManualPage from "@/views/RiderManual/RiderManualPage";

export const metadata: Metadata = {
  title: "Manual del Rider",
  description:
    "Guía de operaciones Sercio para riders: disponibilidad, aceptación de viajes, retiro, entrega, devoluciones, cobros y límites de carga.",
  alternates: { canonical: "https://sercio.com.ar/manual-del-rider" },
};

export default function Page() {
  return <RiderManualPage />;
}
