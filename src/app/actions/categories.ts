"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";
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
      throw new Error(error.response?.data?.message || "Error fetching product categories");
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
      throw new Error(error.response?.data?.message || "Error fetching service categories");
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
        error.response?.data?.message || "Error updating professional categories",
      );
    }
  });

