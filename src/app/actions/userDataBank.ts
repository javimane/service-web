"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const getMyUserDataBankAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/user-data-bank/my`;

    try {
      const response = await axios.get(url, {
        headers: buildActionHeaders(ctx, parsedInput?.token),
      });
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
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/user-data-bank`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.post(url, data, {
        headers: buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error upserting user bank data",
      );
    }
  });
