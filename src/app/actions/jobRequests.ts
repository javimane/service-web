"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";
import { API_ENDPOINTS } from "@/services/api.config";

const authTokenSchema = z.string().optional();

export const listMyJobRequestsAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const response = await axios.get(API_ENDPOINTS.jobRequests.base, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al listar solicitudes",
      );
    }
  });

export const searchJobRequestsAction = publicAction
  .schema(
    z
      .object({
        category: z.number().optional(),
        province: z.number().optional(),
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const params = new URLSearchParams();
      if (parsedInput?.category !== undefined) {
        params.append("category", parsedInput.category.toString());
      }
      if (parsedInput?.province !== undefined) {
        params.append("province", parsedInput.province.toString());
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      // Usamos axios en este caso, se requiere WebApiKeyGuard en el backend para /search
      // Pero no es un action con token de usuario en el /search a menos que await buildActionHeaders lo pase
      // El backend webApiKeyGuard espera un header "x-api-key" si está configurado
      // En await buildActionHeaders normalmente se inyectan las api keys o el interceptor lo hace
      const response = await axios.get(
        `${API_ENDPOINTS.jobRequests.search}${queryString}`,
        {
          headers: await buildActionHeaders(ctx, parsedInput?.token),
        },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al buscar solicitudes",
      );
    }
  });

export const createJobRequestAction = publicAction
  .schema(
    z.object({
      data: z.object({
        description: z.string(),
        image_url: z.string().optional().nullable(),
        categories_services: z.array(z.number()).optional(),
        provinces_id: z.array(z.number()).optional(),
      }),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.jobRequests.base,
        parsedInput.data,
        {
          headers: await buildActionHeaders(ctx, parsedInput.token),
        },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al crear la solicitud",
      );
    }
  });

export const deleteJobRequestAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const response = await axios.delete(
        API_ENDPOINTS.jobRequests.detail(parsedInput.id.toString()),
        {
          headers: await buildActionHeaders(ctx, parsedInput.token),
        },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al eliminar la solicitud",
      );
    }
  });
