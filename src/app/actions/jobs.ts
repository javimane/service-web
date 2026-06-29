"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

export interface Job {
  id: string;
  professional_id: number;
  title: string;
  description?: string;
  requirements?: string;
  is_half_day: boolean;
  is_full_time: boolean;
  is_remote: boolean;
  is_in_person: boolean;
  is_hybrid: boolean;
  province_id?: number;
  seo_path: string;
  created_at: string;
  updated_at: string;
  province?: {
    name: string;
  };
  professional?: {
    profile?: {
      avatar_url?: string;
    };
    companies?: {
      name: string;
    }[];
  };
}

export interface FindAllJobsResponse {
  items: Job[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

const getJobsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  title: z.string().optional(),
  is_half_day: z.boolean().optional(),
  is_full_time: z.boolean().optional(),
  is_remote: z.boolean().optional(),
  is_in_person: z.boolean().optional(),
  is_hybrid: z.boolean().optional(),
  province_id: z.number().optional(),
  professional_id: z.number().optional(),
  created_at: z.string().optional(),
});

export const getJobsAction = publicAction
  .schema(getJobsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const urlParams = new URLSearchParams();
    Object.entries(parsedInput).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, value.toString());
      }
    });

    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/jobs?${urlParams.toString()}`;

    try {
      const response = await axios.get(url);
      return response.data as FindAllJobsResponse;
    } catch (error: any) {
      console.error("Error fetching jobs:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching jobs",
      );
    }
  });

const getJobByIdSchema = z.object({
  id: z.string(),
});

export const getJobByIdAction = publicAction
  .schema(getJobByIdSchema)
  .action(async ({ parsedInput }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/${parsedInput.id}`;

    try {
      const response = await axios.get(url);
      return response.data as Job;
    } catch (error: any) {
      console.error("Error fetching job by ID:", error.message);
      throw new Error(
        error.response?.data?.message || "Error fetching job by ID",
      );
    }
  });

const authTokenSchema = z.string().optional();

const createJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.string().optional(),
  is_half_day: z.boolean().optional(),
  is_full_time: z.boolean().optional(),
  is_remote: z.boolean().optional(),
  is_in_person: z.boolean().optional(),
  is_hybrid: z.boolean().optional(),
  province_id: z.number().optional(),
  token: authTokenSchema,
});

export const createJobAction = publicAction
  .schema(createJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/jobs`;
    const { token, ...data } = parsedInput;

    try {
      const response = await axios.post(url, data, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data as Job;
    } catch (error: any) {
      console.error("Error creating job:", error.message);
      throw new Error(
        error.response?.data?.message || "Error creating job",
      );
    }
  });

const updateJobSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  is_half_day: z.boolean().optional(),
  is_full_time: z.boolean().optional(),
  is_remote: z.boolean().optional(),
  is_in_person: z.boolean().optional(),
  is_hybrid: z.boolean().optional(),
  province_id: z.number().optional(),
  token: authTokenSchema,
});

export const updateJobAction = publicAction
  .schema(updateJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/${parsedInput.id}`;
    const { id, token, ...updateData } = parsedInput;

    try {
      const response = await axios.put(url, updateData, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data as Job;
    } catch (error: any) {
      console.error("Error updating job:", error.message);
      throw new Error(
        error.response?.data?.message || "Error updating job",
      );
    }
  });

const deleteJobSchema = z.object({
  id: z.string(),
  token: authTokenSchema,
});

export const deleteJobAction = publicAction
  .schema(deleteJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/${parsedInput.id}`;
    const { token } = parsedInput;

    try {
      const response = await axios.delete(url, {
        headers: await buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      console.error("Error deleting job:", error.message);
      throw new Error(
        error.response?.data?.message || "Error deleting job",
      );
    }
  });
