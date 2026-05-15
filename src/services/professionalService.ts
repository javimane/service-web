import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type {
  ProfessionalCategoryRow,
  ProfessionalRankingRow,
  ProfessionalRow,
} from "../types/database.types";

export const professionalService = {
  /**
   * @route GET /api/professionals
   * @auth No
   * @param {number} [limit] - Optional limit (clamped to 1..100)
   * @returns {Promise<any[]>} ProfessionalSummary[]
   */
  list: (params?: any) => {
    const urlParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          urlParams.append(key, params[key].toString());
        }
      });
    }
    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";
    return apiClient<any[]>(`${API_ENDPOINTS.professionals.list}${queryString}`, {
      method: "GET",
    });
  },

  /**
   * @route GET /api/professional-details/:professionalId/categories
   * @auth No
   * @param {string | number} professionalId
   * @returns {Promise<ProfessionalCategoryRow[]>}
   */
  getCategories: (professionalId: string | number) =>
    apiClient<ProfessionalCategoryRow[]>(
      API_ENDPOINTS.professionals.categories(professionalId.toString()),
      {
        method: "GET",
      },
    ),

  /**
   * @route GET /api/professional-ranking
   * @auth No
   * @param {string} [categoryId]
   * @param {string} [limit]
   * @returns {Promise<ProfessionalRankingRow[]>}
   */
  getRanking: (categoryId?: string, limit?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.append("categoryId", categoryId);
    if (limit) params.append("limit", limit);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return apiClient<ProfessionalRankingRow[]>(
      `${API_ENDPOINTS.professionals.ranking}${queryString}`,
      {
        method: "GET",
      },
    );
  },

  /**
   * @route GET /api/professionals/me
   * @auth Bearer
   * @returns {Promise<ProfessionalRow | null>}
   */
  getMe: () =>
    apiClient<ProfessionalRow | null>(API_ENDPOINTS.professionals.me, {
      method: "GET",
    }),

  /**
   * @route GET /api/professionals/:id
   * @auth No
   * @param {string | number} id
   * @returns {Promise<any>}
   */
  getDetail: (id: string | number) =>
    apiClient<any>(API_ENDPOINTS.professionals.detail(id.toString()), {
      method: "GET",
    }),

  /**
   * @route PUT /api/professionals/:id
   * @auth Bearer
   * @param {string | number} id
   * @param {any} data
   * @returns {Promise<any>}
   */
  update: (id: string | number, data: any) =>
    apiClient<any>(API_ENDPOINTS.professionals.detail(id.toString()), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * @route POST /api/professionals/:id/views
   * @auth Optional
   * @param {string | number} id
   * @returns {Promise<void>}
   */
  incrementViews: (id: string | number) =>
    apiClient<void>(API_ENDPOINTS.professionals.incrementViews(id.toString()), {
      method: "POST",
    }),
};
