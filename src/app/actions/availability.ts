"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const getAvailabilityByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional/availability/professional/${parsedInput.professionalId}`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching availability",
      );
    }
  });

export const upsertAvailabilityBulkAction = publicAction
  .schema(z.object({ availability: z.array(z.record(z.string(), z.any())) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional/availability/bulk`;

    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error upserting availability",
      );
    }
  });

export const deleteAvailabilityAction = publicAction
  .schema(
    z.object({
      id: z.string(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const availabilityId = parsedInput.id;

    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional/availability/${availabilityId}`;

    try {
      await axios.delete(url, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error deleting availability",
      );
    }
  });
