import type { Metadata } from "next";
import RegisterPage from "@/views/Register/RegisterPage";

export const metadata: Metadata = {
  title: "Crear cuenta - Sercio",
  description:
    "Registrate para publicar, guardar favoritos y acceder a herramientas del panel.",
};

export default function Page() {
  return <RegisterPage />;
}
