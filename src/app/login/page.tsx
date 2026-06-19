import type { Metadata } from "next";
import LoginPage from "@/views/Login/LoginPage";

export const metadata: Metadata = {
  title: "Iniciar sesión - Sercio",
  description:
    "Accedé a tu cuenta para ver tus servicios, mensajes, favoritos y configuración.",
};

export default function Page() {
  return <LoginPage />;
}
