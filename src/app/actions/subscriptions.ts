"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";

export const getSubscriptionByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/subscriptions/professional/${parsedInput.professionalId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching professional subscription:", error.message);
      throw new Error(
        error.response?.data?.message ||
          "Error fetching professional subscription",
      );
    }
  });
