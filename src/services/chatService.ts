import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ContactRequestRow, MessageRow } from "../types/database.types";

type CreateContactRequestPayload = {
  professional_id: number;
  message: string;
};

type SendMessagePayload = {
  content: string;
};

export const chatService = {
  /**
   * @route POST /api/chats/requests
   * @auth Bearer
   */
  createContactRequest: (payload: CreateContactRequestPayload) =>
    apiClient<ContactRequestRow>(API_ENDPOINTS.chats.requests, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * @route GET /api/chats/requests/:id/messages
   * @auth Bearer
   */
  listMessages: (requestId: string | number) =>
    apiClient<MessageRow[]>(API_ENDPOINTS.chats.requestMessages(requestId), {
      method: "GET",
    }),

  /**
   * @route POST /api/chats/requests/:id/messages
   * @auth Bearer
   */
  sendMessage: (requestId: string | number, content: string) =>
    apiClient<MessageRow>(API_ENDPOINTS.chats.requestMessages(requestId), {
      method: "POST",
      body: JSON.stringify({ content } as SendMessagePayload),
    }),
};
