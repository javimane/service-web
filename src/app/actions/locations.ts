"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

export const getProvincesAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/provinces`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching provinces:", error.message);
      throw new Error(error.response?.data?.message || "Error fetching provinces");
    }
  });

export const getDepartmentsAction = publicAction
  .schema(z.object({ provinceId: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/province-departments/province/${parsedInput.provinceId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...ctx.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error fetching departments:", error.message);
      throw new Error(error.response?.data?.message || "Error fetching departments");
    }
  });
