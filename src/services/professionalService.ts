import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type {
  ProfessionalCategoryRow,
  ProfessionalCredentialRow,
  ProfessionalAvailabilityRow,
  ProfessionalRankingRow,
} from "../types/database.types";

export const professionalService = {
  /**
   * @route GET /api/professionals
   * @auth No
   * @param {number} [limit] - Optional limit (clamped to 1..100)
   * @returns {Promise<any[]>} ProfessionalSummary[]
   */
  list: (limit?: number) => {
    const url = limit ? `${API_ENDPOINTS.professionals.list}?limit=${limit}` : API_ENDPOINTS.professionals.list;
    return apiClient<any[]>(url, {
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
    apiClient<ProfessionalCategoryRow[]>(API_ENDPOINTS.professionals.categories(professionalId.toString()), {
      method: "GET",
    }),
    
  /**
   * @route GET /api/professional-details/:professionalId/credentials
   * @auth No
   * @param {string | number} professionalId
   * @returns {Promise<ProfessionalCredentialRow[]>}
   */
  getCredentials: (professionalId: string | number) => 
    apiClient<ProfessionalCredentialRow[]>(API_ENDPOINTS.professionals.credentials(professionalId.toString()), {
      method: "GET",
    }),
    
  /**
   * @route GET /api/professional-details/:professionalId/schedules
   * @auth No
   * @param {string | number} professionalId
   * @returns {Promise<ProfessionalAvailabilityRow[]>}
   */
  getSchedules: (professionalId: string | number) => 
    apiClient<ProfessionalAvailabilityRow[]>(API_ENDPOINTS.professionals.schedules(professionalId.toString()), {
      method: "GET",
    }),
    
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
    
    return apiClient<ProfessionalRankingRow[]>(`${API_ENDPOINTS.professionals.ranking}${queryString}`, {
      method: "GET",
    });
  },
};
