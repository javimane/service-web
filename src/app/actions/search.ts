"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";
import { buildActionHeaders } from "./_utils/authHeaders";

export const searchAction = publicAction
  .schema(
    z.object({
      q: z.string().min(1),
      limit: z.number().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const params = new URLSearchParams({ q: parsedInput.q });
    if (parsedInput.limit) params.append("limit", String(parsedInput.limit));

    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/search?${params.toString()}`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx),
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching search results:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching search results",
      );
    }
  });
