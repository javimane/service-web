"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

export const getProposalsCountAction = publicAction
  .schema(z.object({ professionalId: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/accepted/count/${parsedInput.professionalId}`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching proposals count",
      );
    }
  });

export const getReceivedProposalsAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/received`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching received proposals",
      );
    }
  });

export const getSentProposalsAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/sent`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching sent proposals",
      );
    }
  });

export const acceptProposalAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/professional-proposals/${parsedInput.id}/accept`;

    try {
      const response = await axios.patch(url, {}, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error accepting proposal",
      );
    }
  });
