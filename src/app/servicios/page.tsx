import { Suspense } from "react";
import ServicesPage from "@/views/Services/ServicesPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ServicesPage />
    </Suspense>
  );
}
