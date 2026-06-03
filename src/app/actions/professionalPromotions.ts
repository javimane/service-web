"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";

const promoListSchema = z.record(z.string(), z.any()).optional();

export const getProfessionalPromotionsAction = publicAction
  .schema(promoListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const params = new URLSearchParams(parsedInput as Record<string, string>);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-promotions${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching professional promotions:", error.message);
      throw new Error(
        error.response?.data?.message ||
          "Error fetching professional promotions",
      );
    }
  });

export const getProfessionalPromotionDetailAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-promotions/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching professional promotion detail:",
        error.message,
      );
      throw new Error(
        error.response?.data?.message ||
          "Error fetching professional promotion detail",
      );
    }
  });

export const getPromotionsByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-promotions/professional/${parsedInput.professionalId}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching promotions by professional:",
        error.message,
      );
      throw new Error(
        error.response?.data?.message ||
          "Error fetching promotions by professional",
      );
    }
  });

export const createProfessionalPromotionAction = publicAction
  .schema(z.record(z.string(), z.any()))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-promotions`;

    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error creating professional promotion",
      );
    }
  });

export const updateProfessionalPromotionAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      data: z.record(z.string(), z.any()),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-promotions/${parsedInput.id}`;

    try {
      const response = await axios.put(url, parsedInput.data, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error updating professional promotion",
      );
    }
  });

export const deleteProfessionalPromotionAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-promotions/${parsedInput.id}`;

    try {
      await axios.delete(url, { headers: ctx.headers });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error deleting professional promotion",
      );
    }
  });
