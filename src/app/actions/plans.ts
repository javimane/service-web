"use server";

import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";

export const getSubscriptionPricesAction = publicAction.action(
  async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/subscription-price`;

    const response = await axios.get(url, {
      headers: ctx.headers,
    });

    const payload = Array.isArray(response.data)
      ? response.data
      : (response.data?.data ?? []);

    return payload;
  },
);
