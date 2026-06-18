"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export interface SendNotificationRequest {
  user_id: string;
  sender_id: string;
  type: string;
  title: string;
  content: string;
  source_id?: string;
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  sender_id: string | null;
  type: string;
  title: string;
  content: string;
  source_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const sendNotificationAction = publicAction
  .schema(
    z.object({
      user_id: z.string(),
      sender_id: z.string(),
      type: z.string(),
      title: z.string(),
      content: z.string(),
      source_id: z.string().optional(),
      token: authTokenSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/send`;
    const payload: SendNotificationRequest = {
      user_id: parsedInput.user_id,
      sender_id: parsedInput.sender_id,
      type: parsedInput.type,
      title: parsedInput.title,
      content: parsedInput.content,
      source_id: parsedInput.source_id,
    };

    try {
      const response = await axios.post<NotificationResponse>(url, payload, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error sending notification"
      );
    }
  });

export const getNotificationsAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional()
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/notifications`;

    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching notifications"
      );
    }
  });

export const markAllNotificationsAsReadAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional()
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/read-all`;

    try {
      const response = await axios.patch(
        url,
        {},
        {
          headers: await buildActionHeaders(ctx, parsedInput?.token),
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error marking all as read"
      );
    }
  });

export const markNotificationAsReadAction = publicAction
  .schema(
    z.object({
      id: z.string(),
      token: authTokenSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/${parsedInput.id}/read`;

    try {
      const response = await axios.patch(
        url,
        {},
        {
          headers: await buildActionHeaders(ctx, parsedInput.token),
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error marking notification as read"
      );
    }
  });

export const deleteNotificationAction = publicAction
  .schema(
    z.object({
      id: z.string(),
      token: authTokenSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/${parsedInput.id}`;

    try {
      const response = await axios.delete(url, {
        headers: await buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error deleting notification"
      );
    }
  });
