import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ProfileRow } from "../types/database.types";

export const profileService = {
  /**
   * @route GET /api/profiles/:id
   * @auth Bearer
   * @param {string} id
   * @returns {Promise<ProfileRow>}
   */
  getProfile: (id: string) =>
    apiClient<ProfileRow>(API_ENDPOINTS.profiles.detail(id), {
      method: "GET",
    }),

  /**
   * @route PUT /api/profiles/:id
   * @auth Bearer
   * @param {string} id
   * @param {Partial<ProfileRow>} data
   * @returns {Promise<ProfileRow>}
   */
  updateProfile: (id: string, data: Partial<ProfileRow>) =>
    apiClient<ProfileRow>(API_ENDPOINTS.profiles.detail(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
