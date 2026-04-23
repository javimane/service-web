import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ContactRequestRow, MessageRow } from "../types/database.types";

export const communicationService = {
  /**
   * @route POST /api/communications/contact-request
   * @auth No
   * @param {Partial<ContactRequestRow>} data
   * @returns {Promise<ContactRequestRow>}
   */
  createRequest: (data: Partial<ContactRequestRow>) => 
    apiClient<ContactRequestRow>(`${API_ENDPOINTS.communications.base}/contact-request`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route GET /api/communications/requests/user/:userId
   * @auth No
   * @param {string} userId
   * @returns {Promise<ContactRequestRow[]>}
   */
  getUserRequests: (userId: string) => 
    apiClient<ContactRequestRow[]>(API_ENDPOINTS.communications.userRequests(userId), {
      method: "GET",
    }),
    
  /**
   * @route GET /api/communications/requests/professional/:professionalId
   * @auth No
   * @param {string | number} professionalId
   * @returns {Promise<ContactRequestRow[]>}
   */
  getProfessionalRequests: (professionalId: string | number) => 
    apiClient<ContactRequestRow[]>(API_ENDPOINTS.communications.professionalRequests(professionalId.toString()), {
      method: "GET",
    }),
    
  /**
   * @route GET /api/communications/requests/:requestId/messages
   * @auth No
   * @param {string | number} requestId
   * @returns {Promise<MessageRow[]>}
   */
  getMessages: (requestId: string | number) => 
    apiClient<MessageRow[]>(`${API_ENDPOINTS.communications.base}/requests/${requestId}/messages`, {
      method: "GET",
    }),
};
