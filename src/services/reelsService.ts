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
    if (provinceId !== undefined) params.append("provinceId", provinceId.toString());
    if (departmentId !== undefined) params.append("departmentId", departmentId.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient<ProfessionalReelRow[]>(`${API_ENDPOINTS.reels.base}${queryString}`, {
      method: "GET",
    });
  },

  /**
   * @route GET /api/professional-reels/:id
   * @auth No
   * @param {number} id
   * @returns {Promise<ProfessionalReelRow>}
   */
  getById: (id: number) =>
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
    apiClient<CountViewsReelsRow | null>(API_ENDPOINTS.reels.professionalStats(professionalId), {
      method: "GET",
    }),

  /**
   * @route PUT /api/professional-reels/:id/stats
   * @auth No
   * @param {number} id
   * @param {UpdateReelStatsRequest} data
   * @returns {Promise<ProfessionalReelRow>}
   */
  updateStats: (id: number, data: UpdateReelStatsRequest) =>
    apiClient<ProfessionalReelRow>(API_ENDPOINTS.reels.stats(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
