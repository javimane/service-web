"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const getProposalsCountAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/accepted/count`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching proposals count",
      );
    }
  });

export const getReceivedProposalsAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/received`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching received proposals",
      );
    }
  });

export const getSentProposalsAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/sent`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching sent proposals",
      );
    }
  });

export const acceptProposalAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/${parsedInput.id}/accept`;

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: await buildActionHeaders(ctx, parsedInput.token),
        },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error accepting proposal",
      );
    }
  });

export const createProposalAction = publicAction
  .schema(
    z.object({
      data: z.any(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals`;

    try {
      const response = await axios.post(url, parsedInput.data, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating proposal",
      );
    }
  });
