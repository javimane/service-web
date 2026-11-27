"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";

export const getMercadoPagoPlansAction = publicAction.action(
  async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/webhooks/mercadopago/plans`;

    const response = await axios.get(url, {
      headers: {
        ...ctx.headers,
        "x-api-key": process.env.WEB_API_KEY || "TEST_API_KEY", // Make sure to provide API key
      },
    });

    return response.data; // Expected: { 'PROFESIONAL-PREMIUM': '...', 'PROFESIONAL-BASICO': '...' }
  },
);

const createSubscriptionSchema = z.object({
  email: z.string().email(),
  planId: z.string(),
  continueOnboarding: z.boolean().optional(),
});

export const createMercadoPagoSubscriptionAction = publicAction
  .schema(createSubscriptionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/webhooks/mercadopago/create`;

    const response = await axios.post(
      url,
      {
        email: parsedInput.email,
        planId: parsedInput.planId,
        ...(parsedInput.continueOnboarding && { continueOnboarding: true }),
      },
      {
        headers: ctx.headers,
      },
    );

    return response.data; // Expected: { link: 'https://...' }
  });

export const cancelMercadoPagoSubscriptionAction = publicAction.action(
  async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/webhooks/mercadopago/cancel`;

    const response = await axios.post(
      url,
      {},
      {
        headers: ctx.headers,
      },
    );

    return response.data;
  },
);
