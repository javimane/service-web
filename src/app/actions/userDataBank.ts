"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

export const getMyUserDataBankAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/user-data-bank/my`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching user bank data",
      );
    }
  });

export const upsertUserDataBankAction = publicAction
  .schema(
    z.object({
      cbu: z.string(),
      alias: z.string(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/user-data-bank`;

    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error upserting user bank data",
      );
    }
  });
