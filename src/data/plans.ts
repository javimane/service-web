import { suscriptions } from "../services/suscriptionService";
import { type SuscriptionPrice } from "../types/database.types";

export type PlanFeature = {
  text: string;
  highlighted?: boolean;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  recommended?: boolean;
};

const FALLBACK_BASIC_PRICE = 1000;
const FALLBACK_PREMIUM_PRICE = 10000;

async function resolveSubscriptionPrices(): Promise<SuscriptionPrice[]> {
  try {
    const response = await suscriptions.getSusciptionPrice();
    return Array.isArray(response) ? response : (response?.data ?? []);
  } catch (error) {
    console.error("No se pudieron obtener los precios de suscripción", error);
    return [];
  }
}

const subscriptionPrices = await resolveSubscriptionPrices();

export const plans: Plan[] = [
  {
    id: "profesional-basico",
    name: "Profesional Básico",
    price: subscriptionPrices[0]?.amount ?? FALLBACK_BASIC_PRICE,
    period: "mes",
    description:
      "Todo lo que necesitás para empezar a ofrecer tus servicios profesionales en la plataforma.",
    features: [
      { text: "Perfil profesional completo" },
      { text: "Publicación de productos" },
      { text: "Videos reels de tu trabajo" },
      { text: "Posicionamiento en la web" },
      { text: "Creación de promociones" },
      { text: "Publicación de servicios" },
      { text: "Creación y envío de presupuestos" },
      { text: "Mensajes directos con clientes" },
      { text: "Métricas de tráfico en tu perfil" },
    ],
  },
  {
    id: "profesional-premium",
    name: "Profesional Premium",
    price: subscriptionPrices[1]?.amount ?? FALLBACK_PREMIUM_PRICE,
    period: "mes",
    description:
      "Maximizá tu visibilidad y destacá entre los profesionales de tu zona. Incluye todo lo del plan Básico más beneficios exclusivos.",
    features: [
      { text: "Todo lo del plan Básico" },
      {
        text: "Mejor posicionamiento en el ranking de profesionales",
        highlighted: true,
      },
      { text: "Aparición en la sección de Destacados", highlighted: true },
    ],
    recommended: true,
  },
];

export async function getPlansWithApiPrices(): Promise<Plan[]> {
  return plans;
}
