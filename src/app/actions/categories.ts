"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const getProductCategoriesAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/categories/products`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching product categories:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching product categories",
      );
    }
  });

export const getProductSubcategoriesAction = publicAction
  .schema(
    z
      .object({
        categoryId: z.string().optional(),
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const categoryId = parsedInput?.categoryId;
    const hasValidCategoryId = categoryId !== undefined && categoryId !== "";
    const query = hasValidCategoryId ? `?categoryId=${categoryId}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/categories/products/subcategories${query}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching product subcategories:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching product subcategories",
      );
    }
  });

export const getProductSubcategoryByIdAction = publicAction
  .schema(
    z.object({
      id: z.string(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/categories/products/subcategories/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching product subcategory detail:",
        error.message,
      );
      throw new Error(
        error.response?.data?.message ||
          "Error fetching product subcategory detail",
      );
    }
  });

export const getServiceCategoriesAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/categories/services`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching service categories:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching service categories",
      );
    }
  });

export const updateProfessionalCategoriesAction = publicAction
  .schema(
    z.object({
      categories: z.array(z.number()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professionals/categories`;

    try {
      const response = await axios.post(url, parsedInput.categories, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });

      return response.data;
    } catch (error: any) {
      console.error("Error updating professional categories:", error.message);
      throw new Error(
        error.response?.data?.message ||
          "Error updating professional categories",
      );
    }
  });
