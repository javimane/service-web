import { Suspense } from "react";
import JobsPage from "@/views/Jobs/JobsPage";

export const metadata = {
  title: "Empleos | Sercio",
  description: "Busca los mejores empleos y ofertas laborales en Sercio",
};

export default function JobsRoute() {
  return (
    <Suspense fallback={<div>Cargando empleos...</div>}>
      <JobsPage />
    </Suspense>
  );
}
