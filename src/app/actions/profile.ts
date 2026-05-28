"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const getProfileAction = publicAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/profiles/${parsedInput.id}`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching profile",
      );
    }
  });

export const updateProfileAction = publicAction
  .schema(
    z.object({
      id: z.string(),
      data: z.record(z.string(), z.any()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/profiles/${parsedInput.id}`;

    try {
      const response = await axios.put(url, parsedInput.data, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error updating profile",
      );
    }
  });
