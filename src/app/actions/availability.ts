"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

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
  .schema(z.object({ id: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional/availability/${parsedInput.id}`;

    try {
      await axios.delete(url, { headers: ctx.headers });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error deleting availability",
      );
    }
  });
