import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type {
  ProfessionalReelRow,
  CountViewsReelsRow,
  UpdateReelStatsRequest,
} from "../types/database.types";

export const reelsService = {
  /**
   * @route GET /api/professional-reels
   * @auth No
   * @param {number} [provinceId]
   * @param {number} [departmentId]
   * @returns {Promise<ProfessionalReelRow[]>}
   */
  list: (provinceId?: number, departmentId?: number) => {
    const params = new URLSearchParams();
    if (provinceId !== undefined)
      params.append("provinceId", provinceId.toString());
    if (departmentId !== undefined)
      params.append("departmentId", departmentId.toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient<ProfessionalReelRow[]>(
      `${API_ENDPOINTS.reels.base}${queryString}`,
      {
        method: "GET",
      },
    );
  },

  /**
   * @route GET /api/professional-reels/:id
   * @auth No
   * @param {string} id
   * @returns {Promise<ProfessionalReelRow>}
   */
  getById: (id: string) =>
    apiClient<ProfessionalReelRow>(API_ENDPOINTS.reels.detail(id), {
      method: "GET",
    }),

  /**
   * @route GET /api/professional-reels/professional/:professionalId/stats
   * @auth No
   * @param {number} professionalId
   * @returns {Promise<CountViewsReelsRow | null>}
   */
  getProfessionalStats: (professionalId: number) =>
    apiClient<CountViewsReelsRow | null>(
      API_ENDPOINTS.reels.professionalStats(professionalId),
      {
        method: "GET",
      },
    ),

  /**
   * @route PUT /api/professional-reels/:id/stats
   * @auth No
   * @param {string} id
   * @param {UpdateReelStatsRequest} data
   * @returns {Promise<ProfessionalReelRow>}
   */
  updateStats: (id: string, data: UpdateReelStatsRequest) =>
    apiClient<ProfessionalReelRow>(API_ENDPOINTS.reels.stats(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * @route POST /api/professional-reels
   * @auth Bearer
   * @param {Partial<ProfessionalReelRow>} data
   * @returns {Promise<ProfessionalReelRow>}
   */
  create: (data: Partial<ProfessionalReelRow>) =>
    apiClient<ProfessionalReelRow>(API_ENDPOINTS.reels.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<void>(API_ENDPOINTS.reels.detail(id), {
      method: "DELETE",
    }),
};
