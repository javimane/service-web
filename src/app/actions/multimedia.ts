"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();
const tokenizedRecordSchema = z
  .object({ token: authTokenSchema })
  .catchall(z.any());

// Videos
export const getVideosAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos`;
    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error fetching videos");
    }
  });

export const getVideosByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/professional/${parsedInput.professionalId}`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching professional videos",
      );
    }
  });

export const upsertVideoLikeAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      is_like: z.boolean(),
      token: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/${parsedInput.id}/like`;
    try {
      await axios.post(
        url,
        { is_like: parsedInput.is_like },
        { headers: await buildActionHeaders(ctx, parsedInput.token) },
      );
      return { success: true };
    } catch (error: any) {
      console.error("Error upserting video like:", error.message);
      return { success: false, error: error.message };
    }
  });

export const incrementVideoViewsAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/${parsedInput.id}/view`;
    try {
      await axios.post(url, {}, { headers: ctx.headers });
      return { success: true };
    } catch (error: any) {
      console.error("Error incrementing video views:", error.message);
      return { success: false, error: error.message };
    }
  });

export const getVideoStatsByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/professional/${parsedInput.professionalId}/stats`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching video stats:", error.message);
      return null;
    }
  });

// Images
export const getImagesByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-images/professional/${parsedInput.professionalId}`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching professional images",
      );
    }
  });

export const createVideoAction = publicAction
  .schema(tokenizedRecordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos`;
    const { token, ...data } = parsedInput;
    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error creating video");
    }
  });

export const getVideoDetailAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/${parsedInput.id}`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching video detail",
      );
    }
  });

export const deleteVideoAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/${parsedInput.id}`;
    try {
      await axios.delete(url, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error deleting video");
    }
  });

export const updateVideoAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      title: z.string(),
      description: z.string(),
      video_url: z.string(),
      thumbnail_url: z.string().optional(),
      duration_seconds: z.number().optional(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/${parsedInput.id}`;
    const { id, token, ...body } = parsedInput;
    try {
      const response = await axios.put(url, body, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error updating video");
    }
  });

export const createProfessionalImageAction = publicAction
  .schema(tokenizedRecordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-images`;
    const { token, ...data } = parsedInput;
    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating professional image",
      );
    }
  });

export const deleteProfessionalImageAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-images/${parsedInput.id}`;
    try {
      await axios.delete(url, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error deleting professional image",
      );
    }
  });

export const getMultimediaUploadUrlAction = publicAction
  .schema(
    z.object({
      professionalId: z.number(),
      fileName: z.string(),
      fileType: z.string(),
      type: z.enum(["REEL", "PROFILE"]),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/videos/upload-url`;
    const { token, ...data } = parsedInput;
    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error getting upload URL",
      );
    }
  });
