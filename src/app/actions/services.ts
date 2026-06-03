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

export const getServicesAction = publicAction
  .schema(serviceListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const params = new URLSearchParams();
    if (parsedInput) {
      Object.entries(parsedInput).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
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
  .schema(z.object({ professionalId: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/services/professional/${parsedInput.professionalId}`;

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
