import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ReviewRow } from "../types/database.types";

export const reviewService = {
  /**
   * @route GET /api/reviews/professional/:professionalId
   * @auth No
   * @param {string | number} professionalId
   * @returns {Promise<ReviewRow[]>}
   */
  findByProfessionalId: (professionalId: string | number) =>
    apiClient<ReviewRow[]>(API_ENDPOINTS.reviews.byProfessional(professionalId), {
      method: "GET",
    }),

  /**
   * @route POST /api/reviews
   * @auth Bearer
   * @param {Partial<ReviewRow>} data
   * @returns {Promise<ReviewRow>}
   */
  create: (data: Partial<ReviewRow>) =>
    apiClient<ReviewRow>(API_ENDPOINTS.reviews.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
