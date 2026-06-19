import type { Metadata } from "next";
import { plans } from "@/data/plans";
import PlanPaymentPage from "@/views/PlanPayment/PlanPaymentPage";

type Props = { params: Promise<{ planId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { planId } = await params;
  const plan = plans.find((item) => item.id === planId);

  if (!plan) {
    return {
      title: "Plan no encontrado - Sercio",
      description: "El plan solicitado no está disponible.",
    };
  }

  return {
    title: `${plan.name} - Pago de plan - Sercio`,
    description: plan.description,
  };
}

export default function Page() {
  return <PlanPaymentPage />;
}
