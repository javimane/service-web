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

export const plans: Plan[] = [
  {
    id: "gratuito",
    name: "Gratuito",
    price: 0,
    period: "mes",
    description:
      "Crea tu perfil profesional y comienza a ofrecer tus servicios en la plataforma sin costo alguno. Ideal para profesionales que están empezando y quieren probar la plataforma.",
    features: [
      { text: "Perfil profesional básico" },
      { text: "Posicionamiento en la web" },
      { text: "Publicación de productos" },
      { text: "Publicación de servicios" },
      { text: "Mensajes directos con clientes" },
      { text: "Métricas de tráfico en tu perfil" },
      { text: "Tienda de productos" },
    ],
  },
  {
    id: "profesional-basico",
    name: "Profesional Básico",
    price: FALLBACK_BASIC_PRICE,
    period: "mes",
    description: "Aumentá tu visibilidad con herramientas profesionales.",
    features: [
      { text: "Todo lo del plan Gratuito" },
      { text: "Videos reels de tu trabajo", highlighted: true },
      { text: "Publicación de videos", highlighted: true },
      {
        text: "Creación de promociones y promociones bancarias",
        highlighted: true,
      },
      { text: "Creación y envío de presupuestos", highlighted: true },
      { text: "Gestión de citas y agenda", highlighted: true },
    ],
  },
  {
    id: "profesional-premium",
    name: "Profesional Premium",
    price: FALLBACK_PREMIUM_PRICE,
    period: "mes",
    description:
      "Maximizá tu visibilidad y destacá entre los profesionales de tu zona. Incluye todo lo del plan Básico más beneficios exclusivos.",
    features: [
      { text: "Todo lo del plan Básico" },
      {
        text: "Mejor posicionamiento en el ranking de profesionales",
        highlighted: true,
      },
      { text: "Mejor posicionamiento en búsquedas", highlighted: true },
    ],
    recommended: true,
  },
];

export function mergePlansWithSubscriptionPrices(
  currentPlans: Plan[],
  subscriptionPrices: SuscriptionPrice[],
): Plan[] {
  return currentPlans.map((plan) => {
    if (plan.id === "profesional-basico") {
      return { ...plan, price: subscriptionPrices[0]?.amount ?? plan.price };
    }

    if (plan.id === "profesional-premium") {
      return { ...plan, price: subscriptionPrices[1]?.amount ?? plan.price };
    }

    return plan;
  });
}
