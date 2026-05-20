"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const getProfessionalReviewsAction = publicAction
  .schema(z.object({ professionalId: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/professional/${parsedInput.professionalId}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching professional reviews:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching reviews",
      );
    }
  });

export const createReviewAction = publicAction
  .schema(
    z.object({
      professional_id: z.number(),
      user_id: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().min(1),
      image_url: z.string().optional(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/reviews`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.post(url, data, {
        headers: buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating review:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al enviar la opinión",
      );
    }
  });
