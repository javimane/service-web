import AccountSetupPage from "@/views/AccountSetup/AccountSetupPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurá tu cuenta | Sercio",
  robots: { index: false, follow: false },
};

export default function CompleteProfileRoute() {
  return <AccountSetupPage />;
}
