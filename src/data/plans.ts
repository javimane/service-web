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

export const plans: Plan[] = [
  {
    id: "profesional-basico",
    name: "Profesional Básico",
    price: 9990,
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
    price: 19990,
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
