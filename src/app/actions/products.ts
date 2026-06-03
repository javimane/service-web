"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const productListSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  professionalId: z.number().optional(),
  name: z.string().optional(),
  sortBy: z.string().optional(),
  provinceId: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().optional(),
  categoryId: z.number().optional(),
  is_foreign: z.boolean().optional(),
  price: z.number().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  brand: z.string().optional(),
  ean: z.string().optional(),
});
const authTokenSchema = z.string().optional();
const tokenizedRecordSchema = z
  .object({ token: authTokenSchema })
  .catchall(z.any());

export const getProductsAction = publicAction
  .schema(productListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const urlParams = new URLSearchParams();
    Object.entries(parsedInput).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, value.toString());
      }
    });

    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching products",
      );
    }
  });

const productDetailSchema = z.object({
  id: z.string().or(z.number()),
});

export const getProductDetailAction = publicAction
  .schema(productDetailSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching product detail:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching product detail",
      );
    }
  });

export const getProductsByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products/professional/${parsedInput.professionalId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching products by professional:", error.message);
      throw new Error(
        error.response?.data?.message ||
          "Error fetching products by professional",
      );
    }
  });

export const getProductByEanAction = publicAction
  .schema(
    z.object({
      ean: z.string(),
      professionalId: z.number().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const query = parsedInput.professionalId
      ? `?professionalId=${parsedInput.professionalId}`
      : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products/ean/${parsedInput.ean}${query}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching product by EAN",
      );
    }
  });

export const createProductAction = publicAction
  .schema(tokenizedRecordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating product",
      );
    }
  });

export const assignProductToProfessionalAction = publicAction
  .schema(tokenizedRecordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products/assign-professional`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error assigning product",
      );
    }
  });

export const updateProfessionalProductAction = publicAction
  .schema(
    z.object({
      professionalId: z.number(),
      productId: z.string().or(z.number()),
      updates: z.record(z.string(), z.any()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products/professional/${parsedInput.professionalId}/product/${parsedInput.productId}`;

    try {
      const response = await axios.put(url, parsedInput.updates, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error updating professional product",
      );
    }
  });

export const unassignProductFromProfessionalAction = publicAction
  .schema(
    z.object({
      productId: z.string(),
      professionalId: z.number(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products/${parsedInput.productId}/professional/${parsedInput.professionalId}`;

    try {
      await axios.delete(url, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error unassigning product",
      );
    }
  });

export const massUpdateProductPricesAction = publicAction
  .schema(tokenizedRecordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/products/mass-update-prices`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.put(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error mass updating prices",
      );
    }
  });
