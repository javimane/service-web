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
      "Crea tu perfil profesional y comienza a ofrecer tus servicios en la plataforma sin costo alguno. Ideal para probar la plataforma.",
    features: [
      { text: "Perfil profesional básico" },
      { text: "Posicionamiento en la web" },
      { text: "Publicación de productos sin límite" },
      { text: "Publicación de servicios sin límite" },
      { text: "Mensajes directos con clientes" },
      { text: "Métricas de tráfico en tu perfil" },
      { text: "Tienda de productos" },
      { text: "Gestión de citas y agenda" },
      { text: "Vista de trabajos solicitados" },
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
      { text: "Videos de tu trabajo sin límite", highlighted: true },
      { text: "Publicación de historias sin límite", highlighted: true },
      {
        text: "Creación de promociones y promociones bancarias sin límite",
        highlighted: true,
      },
      {
        text: "Creación y envío de presupuestos sin límite",
        highlighted: true,
      },
      { text: "Creación de Empleos sin límite", highlighted: true },
      { text: "Creación de Publicaciones sin límite", highlighted: true },
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
        text: "Mejor posicionamiento en el ranking de profesionales dentro de la plataforma",
        highlighted: true,
      },
      {
        text: "Mejor posicionamiento en búsquedas de la plataforma",
        highlighted: true,
      },
    ],
    recommended: true,
  },
];

export function mergePlansWithSubscriptionPrices(
  currentPlans: Plan[],
  subscriptionPrices: SuscriptionPrice[],
): Plan[] {
  return currentPlans.map((plan) => {
    if (plan.id === "free" || plan.id === "gratuito") {
      return { ...plan, price: subscriptionPrices[0]?.amount ?? plan.price };
    }

    if (plan.id === "profesional-basico") {
      return { ...plan, price: subscriptionPrices[1]?.amount ?? plan.price };
    }

    if (plan.id === "profesional-premium") {
      return { ...plan, price: subscriptionPrices[2]?.amount ?? plan.price };
    }

    return plan;
  });
}
