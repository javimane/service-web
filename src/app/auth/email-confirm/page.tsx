import { Suspense } from "react";
import EmailConfirmationPage from "@/views/AuthConfirm/EmailConfirmationPage";

export const metadata = {
  title: "Confirmar correo electrónico",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Suspense fallback={null}><EmailConfirmationPage /></Suspense>;
}
