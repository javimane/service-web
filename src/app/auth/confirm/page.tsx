import { Suspense } from "react";
import ResetPasswordPage from "../../../views/AuthConfirm/ResetPasswordPage";

export const metadata = {
  title: "Restablecer Contraseña | Sercio",
  description: "Cree una nueva contraseña para su cuenta de Sercio",
};

export default function AuthConfirm() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Cargando...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
