"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

import { buildActionHeaders } from "./_utils/authHeaders";

const reelListSchema = z.object({
  provinceId: z.number().optional(),
  departmentId: z.number().optional(),
  professionalId: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const getReelsAction = publicAction
  .schema(reelListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const params = new URLSearchParams();
    if (parsedInput.provinceId)
      params.append("provinceId", parsedInput.provinceId.toString());
    if (parsedInput.departmentId)
      params.append("departmentId", parsedInput.departmentId.toString());
    if (parsedInput.professionalId)
      params.append("professionalId", parsedInput.professionalId.toString());
    if (parsedInput.page)
      params.append("page", parsedInput.page.toString());
    if (parsedInput.limit)
      params.append("limit", parsedInput.limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching reels:", error.message);
      throw new Error(error.response?.data?.message || "Error fetching reels");
    }
  });

export const getReelDetailAction = publicAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching reel detail:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching reel detail",
      );
    }
  });

export const getProfessionalReelStatsAction = publicAction
  .schema(z.object({ professionalId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels/professional/${parsedInput.professionalId}/stats`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching professional reel stats:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching reel stats",
      );
    }
  });

export const updateReelStatsAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      data: z.object({
        views: z.number().optional(),
        likes: z.number().optional(),
      }),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels/${parsedInput.id}/stats`;

    try {
      const response = await axios.put(url, parsedInput.data, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error updating reel stats:", error.message);
      return { success: false, error: error.message };
    }
  });

export const getReelsByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels/professional/${parsedInput.professionalId}`;

    try {
      const response = await axios.get(url, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching reels by professional",
      );
    }
  });

export const createReelAction = publicAction
  .schema(z.record(z.string(), z.any()))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels`;

    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error creating reel");
    }
  });

export const deleteReelAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels/${parsedInput.id}`;

    try {
      await axios.delete(url, { headers: ctx.headers });
      return { success: true };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error deleting reel");
    }
  });

export const upsertReelLikeAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      is_like: z.boolean(),
      token: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-reels/${parsedInput.id}/like`;
    try {
      await axios.post(
        url,
        { is_like: parsedInput.is_like },
        { headers: await buildActionHeaders(ctx, parsedInput.token) },
      );
      return { success: true };
    } catch (error: any) {
      console.error("Error upserting reel like:", error.message);
      return { success: false, error: error.message };
    }
  });
