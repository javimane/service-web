"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

const professionalListSchema = z.object({
  limit: z.number().optional(),
  page: z.number().optional(),
  categoryId: z.string().or(z.number()).optional(),
  category_id: z.string().or(z.number()).optional(),
  provinceId: z.string().or(z.number()).optional(),
  province_id: z.string().or(z.number()).optional(),
  departmentId: z.string().or(z.number()).optional(),
  department_id: z.string().or(z.number()).optional(),
  query: z.string().optional(),
  name: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().optional(),
  isMatriculate: z.string().optional(), // 'true' | 'false'
  is_matriculate: z.string().optional(), // 'true' | 'false'
  isVerified: z.string().optional(), // 'true' | 'false'
  emergency: z.string().optional(), // 'true' | 'false'
  specialty: z.string().optional(),
  publicTrade: z.string().optional(), // 'true' | 'false'
  public_trade: z.string().optional(), // 'true' | 'false'
  sortBy: z.string().optional(),
  sort_by: z.string().optional(),
});

export const getProfessionalsAction = publicAction
  .schema(professionalListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const urlParams = new URLSearchParams();
    Object.entries(parsedInput).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, value.toString());
      }
    });

    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals${queryString}`;

    try {
      console.log("[Action] ctx.headers:", JSON.stringify(ctx.headers));
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
          "x-api-key": env.WEB_API_KEY,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching professionals:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching professionals",
      );
    }
  });

const professionalDetailSchema = z.object({
  id: z.string().or(z.number()),
});

export const getProfessionalDetailAction = publicAction
  .schema(professionalDetailSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching professional detail:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching professional detail",
      );
    }
  });

export const getProfessionalMeAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/me`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching professional me",
      );
    }
  });

export const getProfessionalSubscriptionAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/me/subscription`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error fetching professional subscription",
      );
    }
  });

export const incrementProfessionalViewsAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/${parsedInput.id}/views`;

    try {
      await axios.post(
        url,
        {},
        {
          headers: {
            ...ctx.headers,
          },
        },
      );
      return { success: true };
    } catch (error: any) {
      console.error("Error incrementing professional views:", error.message);
      // We don't necessarily want to throw here as this is a background task
      return { success: false, error: error.message };
    }
  });

export const updateProfessionalAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      data: z.record(z.string(), z.any()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/${parsedInput.id}`;

    try {
      const response = await axios.put(url, parsedInput.data, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error updating professional",
      );
    }
  });

export const getCompanyLocationsAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/${parsedInput.id}/company-locations`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching company locations:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching company locations",
      );
    }
  });

/**
 * Crea o actualiza el perfil profesional del usuario autenticado (usualmente para el plan Free).
 */
export const createProfessionalMeAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/me`;

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: await buildActionHeaders(ctx, parsedInput?.token),
        },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error fetching professional subscription",
      );
    }
  });
