"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const serviceListSchema = z.record(z.string(), z.any()).optional();
const authTokenSchema = z.string().optional();
const tokenizedRecordSchema = z
  .object({ token: authTokenSchema })
  .catchall(z.any());

export interface PaginatedServicesResponse {
  items: any[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export const getServicesAction = publicAction
  .schema(
    z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        name: z.string().optional(),
        categoryId: z.number().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        provinceId: z.number().optional(),
        province: z.string().optional(),
        departmentId: z.number().optional(),
        isActive: z.boolean().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        radius: z.number().optional(),
        is_premium: z.boolean().optional(),
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const params = new URLSearchParams();
    if (parsedInput) {
      Object.entries(parsedInput).forEach(([key, value]) => {
        if (value !== undefined && value !== null)
          params.append(key, String(value));
      });
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data as PaginatedServicesResponse;
    } catch (error: any) {
      console.error("Error fetching services:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching services",
      );
    }
  });

export const getServiceDetailAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching service detail:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching service detail",
      );
    }
  });

export const getServicesByProfessionalAction = publicAction
  .schema(
    z.object({
      professionalId: z.string().or(z.number()),
      name: z.string().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { professionalId, ...queryParams } = parsedInput;
    const query = new URLSearchParams();
    if (queryParams.name) query.append("name", queryParams.name);
    if (queryParams.page !== undefined) query.append("page", String(queryParams.page));
    if (queryParams.limit !== undefined) query.append("limit", String(queryParams.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services/professional/${professionalId}${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching services by professional:", error.message);
      throw new Error(
        error.response?.data?.message ||
          "Error fetching services by professional",
      );
    }
  });

export const createServiceAction = publicAction
  .schema(tokenizedRecordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating service",
      );
    }
  });

export const updateServiceAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      data: z.record(z.string(), z.any()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services/${parsedInput.id}`;

    try {
      const response = await axios.put(url, parsedInput.data, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error updating service",
      );
    }
  });

export const deleteServiceAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services/${parsedInput.id}`;

    try {
      await axios.delete(url, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error deleting service",
      );
    }
  });
