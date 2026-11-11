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
   * @param {string | number | { professionalId?: string | number; productId?: string; serviceId?: string }} target
   * @returns {Promise<UserFavoriteRow>}
   */
  addFavorite: (
    target:
      | string
      | number
      | {
          professionalId?: string | number;
          productId?: string;
          serviceId?: string;
        },
  ) => {
    const payload =
      typeof target === "object"
        ? target
        : { professionalId: target };
    return apiClient<UserFavoriteRow>(API_ENDPOINTS.users.favorites, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * @route DELETE /api/users/me/favorites/:id
   * @auth Bearer
   * @param {string | number} id
   * @returns {Promise<void>}
   */
  removeFavorite: (id: string | number) =>
    apiClient<void>(
      API_ENDPOINTS.users.favoriteDetail(id.toString()),
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

  getMobilePhone: () =>
    apiClient<{ mobilePhone: string | null }>(API_ENDPOINTS.users.mobilePhone, {
      method: "GET",
    }),
};
