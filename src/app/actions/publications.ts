"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

export interface PublicationImage {
  image_url: string;
  display_order: number;
}

export interface Publication {
  id: string;
  title: string;
  description: string;
  professional_id: number;
  status: string;
  seo_path: string;
  created_at: string;
  updated_at: string;
  publication_images: PublicationImage[];
  professional?: any;
}

export interface FindAllPublicationsResponse {
  items: Publication[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface UploadPublicationImageResponse {
  uploadUrl: string;
  key: string;
}

const getPublicationsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  title: z.string().optional(),
  provinceId: z.number().optional(),
  professionalId: z.number().optional(),
});

export const getPublicationsAction = publicAction
  .schema(getPublicationsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const urlParams = new URLSearchParams();
    Object.entries(parsedInput).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, value.toString());
      }
    });

    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-publications${queryString}`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx),
      });

      return response.data as FindAllPublicationsResponse;
    } catch (error: any) {
      console.error("Error fetching publications:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching publications",
      );
    }
  });

const getPublicationByIdSchema = z.object({
  id: z.string().or(z.number()),
});

export const getPublicationByIdAction = publicAction
  .schema(getPublicationByIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-publications/${parsedInput.id}`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx),
      });

      return response.data as Publication;
    } catch (error: any) {
      console.error("Error fetching publication detail:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching publication detail",
      );
    }
  });

const authTokenSchema = z.string().optional();
const createPublicationSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    status: z.string().optional(),
    images_to_save: z.array(z.string()).optional(),
    token: authTokenSchema,
  })
  .catchall(z.any());

export const createPublicationAction = publicAction
  .schema(createPublicationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-publications`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data as Publication;
    } catch (error: any) {
      console.error("Error creating publication:", error.message);
      throw new Error(
        error.response?.data?.message || "Error creating publication",
      );
    }
  });

const updatePublicationSchema = z
  .object({
    id: z.string().or(z.number()),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    images_url: z.array(z.string()).optional(),
    images_to_save: z.array(z.string()).optional(),
    images_to_delete: z.array(z.string()).optional(),
    token: authTokenSchema,
  })
  .catchall(z.any());

export const updatePublicationAction = publicAction
  .schema(updatePublicationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-publications/${parsedInput.id}`;
    const { id, token, ...updateData } = parsedInput;

    try {
      const response = await axios.put(url, updateData, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data as Publication;
    } catch (error: any) {
      console.error("Error updating publication:", error.message);
      throw new Error(
        error.response?.data?.message || "Error updating publication",
      );
    }
  });

const deletePublicationSchema = z.object({
  id: z.string().or(z.number()),
  token: authTokenSchema,
});

export const deletePublicationAction = publicAction
  .schema(deletePublicationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-publications/${parsedInput.id}`;
    const { token } = parsedInput;

    try {
      const response = await axios.delete(url, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      console.error("Error deleting publication:", error.message);
      throw new Error(
        error.response?.data?.message || "Error deleting publication",
      );
    }
  });

const getUploadUrlSchema = z.object({
  token: authTokenSchema,
  fileType: z.string().optional(),
});

export const getPublicationUploadUrlAction = publicAction
  .schema(getUploadUrlSchema)
  .action(async ({ parsedInput, ctx }) => {
    let url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-publications/upload-url`;
    const { token, fileType } = parsedInput;

    if (fileType) {
      url += `?fileType=${encodeURIComponent(fileType)}`;
    }

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data as UploadPublicationImageResponse;
    } catch (error: any) {
      console.error("Error getting publication upload url:", error.message);
      throw new Error(
        error.response?.data?.message || "Error getting upload URL",
      );
    }
  });
