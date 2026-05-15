"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

// Videos
export const getVideosAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
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

export const incrementVideoLikesAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/${parsedInput.id}/like`;
    try {
      await axios.post(url, {}, { headers: ctx.headers });
      return { success: true };
    } catch (error: any) {
      console.error("Error incrementing video likes:", error.message);
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
  .schema(z.record(z.string(), z.any()))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos`;
    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
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
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-videos/${parsedInput.id}`;
    try {
      await axios.delete(url, { headers: ctx.headers });
      return { success: true };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error deleting video");
    }
  });

export const createProfessionalImageAction = publicAction
  .schema(z.record(z.string(), z.any()))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-images`;
    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating professional image",
      );
    }
  });

export const deleteProfessionalImageAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-images/${parsedInput.id}`;
    try {
      await axios.delete(url, { headers: ctx.headers });
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
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/videos/upload-url`;
    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error getting upload URL",
      );
    }
  });
