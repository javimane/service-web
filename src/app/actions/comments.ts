"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

// ==========================================
// PRODUCT COMMENTS ACTIONS
// ==========================================

export const getProductCommentsAction = publicAction
  .schema(
    z.object({
      productId: z.string().min(1),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { productId, page, limit } = parsedInput;
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/product-comments/product/${productId}?page=${page}&limit=${limit}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching product comments:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al cargar los comentarios del producto",
      );
    }
  });

export const createProductCommentAction = publicAction
  .schema(
    z.object({
      product_id: z.string().min(1),
      text: z.string().min(1, "El comentario no puede estar vacío"),
      user_name: z.string().min(1, "Ingresá tu nombre"),
      rating: z.number().min(1).max(5).optional(),
      user_avatar: z.string().optional(),
      image_url: z.string().optional(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { token, ...data } = parsedInput;
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/product-comments`;

    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating product comment:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al enviar el comentario del producto",
      );
    }
  });

// ==========================================
// SERVICE COMMENTS ACTIONS
// ==========================================

export const getServiceCommentsAction = publicAction
  .schema(
    z.object({
      serviceId: z.string().min(1),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { serviceId, page, limit } = parsedInput;
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/service-comments/service/${serviceId}?page=${page}&limit=${limit}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching service comments:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al cargar los comentarios del servicio",
      );
    }
  });

export const createServiceCommentAction = publicAction
  .schema(
    z.object({
      service_id: z.string().min(1),
      text: z.string().min(1, "El comentario no puede estar vacío"),
      user_name: z.string().min(1, "Ingresá tu nombre"),
      rating: z.number().min(1).max(5).optional(),
      user_avatar: z.string().optional(),
      image_url: z.string().optional(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { token, ...data } = parsedInput;
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/service-comments`;

    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating service comment:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al enviar el comentario del servicio",
      );
    }
  });
