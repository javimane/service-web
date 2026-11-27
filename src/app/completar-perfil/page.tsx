import AccountSetupPage from "@/views/AccountSetup/AccountSetupPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurá tu cuenta | Sercio",
  robots: { index: false, follow: false },
};

export default async function CompleteProfileRoute({
  searchParams,
}: {
  searchParams: Promise<{ suscripcion?: string | string[] }>;
}) {
  const { suscripcion } = await searchParams;
  return <AccountSetupPage subscriptionReturn={suscripcion === "regreso"} />;
}
