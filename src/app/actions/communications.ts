"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";

export const getUserRequestsAction = publicAction
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/communications/requests/user/${parsedInput.userId}`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching user requests",
      );
    }
  });

export const getRequestMessagesAction = publicAction
  .schema(z.object({ requestId: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/chats/requests/${parsedInput.requestId}/messages`;

    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching messages",
      );
    }
  });

export const createRequestAction = publicAction
  .schema(
    z.object({
      professional_id: z.number(),
      message: z.string(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/chats/requests`;

    try {
      const response = await axios.post(url, parsedInput, {
        headers: ctx.headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating request",
      );
    }
  });

export const sendMessageAction = publicAction
  .schema(
    z.object({
      requestId: z.string().or(z.number()),
      content: z.string(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/chats/requests/${parsedInput.requestId}/messages`;

    try {
      const response = await axios.post(
        url,
        { content: parsedInput.content },
        { headers: ctx.headers },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error sending message");
    }
  });
