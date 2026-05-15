"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

const bankPromotionListSchema = z.record(z.string(), z.any()).optional();

export const getBankPromotionsAction = publicAction
  .schema(bankPromotionListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const urlParams = new URLSearchParams();
    if (parsedInput) {
      Object.entries(parsedInput).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlParams.append(key, value.toString());
        }
      });
    }

    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/bank-promotions${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching bank promotions:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching bank promotions",
      );
    }
  });

export const getBankPromotionDetailAction = publicAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/bank-promotions/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching bank promotion detail:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching bank promotion detail",
      );
    }
  });

export const getBanksAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/banks`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching banks:", error.message);
      throw new Error(error.response?.data?.message || "Error fetching banks");
    }
  });

export const getMyBankPromotionsAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/bank-promotions/my-promotions`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching my bank promotions",
      );
    }
  });

export const createBankPromotionAction = publicAction
  .schema(z.record(z.string(), z.any()))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/bank-promotions`;

    try {
      const response = await axios.post(url, parsedInput, {
        headers: { ...ctx.headers },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating bank promotion",
      );
    }
  });

export const updateBankPromotionAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      data: z.record(z.string(), z.any()),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/bank-promotions/${parsedInput.id}`;

    try {
      const response = await axios.patch(url, parsedInput.data, {
        headers: { ...ctx.headers },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error updating bank promotion",
      );
    }
  });

export const deleteBankPromotionAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/bank-promotions/${parsedInput.id}`;

    try {
      await axios.delete(url, {
        headers: { ...ctx.headers },
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error deleting bank promotion",
      );
    }
  });
