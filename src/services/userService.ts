import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { RoleRow, UserFavoriteRow } from "../types/database.types";

export const userService = {
  /**
   * @route GET /api/users/me/favorites
   * @auth Bearer
   * @returns {Promise<{ data: any[]; count: number; page: number; limit: number; totalPages: number }>}
   */
  getFavorites: () =>
    apiClient<{
      data: any[];
      count: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(API_ENDPOINTS.users.favorites, {
      method: "GET",
    }),

  /**
   * @route POST /api/users/me/favorites
   * @auth Bearer
   * @param {string | number} professionalId - ID of the professional to favorite
   * @returns {Promise<UserFavoriteRow>}
   */
  addFavorite: (professionalId: string | number) =>
    apiClient<UserFavoriteRow>(API_ENDPOINTS.users.favorites, {
      method: "POST",
      body: JSON.stringify({ professionalId }),
    }),

  /**
   * @route DELETE /api/users/me/favorites/:professionalId
   * @auth Bearer
   * @param {string | number} professionalId
   * @returns {Promise<void>}
   */
  removeFavorite: (professionalId: string | number) =>
    apiClient<void>(
      API_ENDPOINTS.users.favoriteDetail(professionalId.toString()),
      {
        method: "DELETE",
      },
    ),

  /**
   * @route GET /api/users/roles
   * @auth No
   * @returns {Promise<RoleRow[]>}
   */
  getRoles: () =>
    apiClient<RoleRow[]>(API_ENDPOINTS.users.roles, {
      method: "GET",
    }),

  /**
   * @route GET /api/users/:userId/benefits
   * @auth Bearer (assumed)
   * @param {string} userId
   * @returns {Promise<any>}
   */
  getBenefits: (userId: string) =>
    apiClient<any>(API_ENDPOINTS.users.benefits(userId), {
      method: "GET",
    }),

  /**
   * @route POST /api/users/me/device-tokens
   * @auth Bearer
   * @param {string} token
   * @param {string} [platform]
   * @returns {Promise<any>}
   */
  registerDeviceToken: (token: string, platform = "web") =>
    apiClient<any>(API_ENDPOINTS.users.deviceTokens, {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    }),

  /**
   * @route DELETE /api/users/me/device-tokens
   * @auth Bearer
   * @param {string} token
   * @returns {Promise<void>}
   */
  removeDeviceToken: (token: string) =>
    apiClient<void>(API_ENDPOINTS.users.deviceTokens, {
      method: "DELETE",
      body: JSON.stringify({ token }),
    }),
};
