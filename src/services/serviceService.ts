import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ServiceRow } from "../types/database.types";

export const serviceService = {
  /**
   * @route GET /api/services
   * @auth No
   * @param {Object} [filters] - Optional ServiceFilters
   * @returns {Promise<ServiceRow[]>}
   */
  list: (filters?: Record<string, string | number | boolean>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient<ServiceRow[]>(`${API_ENDPOINTS.services.list}${queryString}`, {
      method: "GET",
    });
  },
  
  /**
   * @route GET /api/services/:id
   * @auth No
   * @param {string | number} id
   * @returns {Promise<ServiceRow>}
   */
  getDetail: (id: string | number) => 
    apiClient<ServiceRow>(API_ENDPOINTS.services.detail(id.toString()), {
      method: "GET",
    }),
    
  /**
   * @route GET /api/services/professional/:professionalId
   * @auth Bearer
   * @param {string | number} professionalId
   * @returns {Promise<ServiceRow[]>}
   */
  getByProfessional: (professionalId: string | number) => 
    apiClient<ServiceRow[]>(`${API_ENDPOINTS.services.base}/professional/${professionalId}`, {
      method: "GET",
    }),
    
  /**
   * @route POST /api/services
   * @auth Bearer
   * @param {any} data - CreateServiceRequest
   * @returns {Promise<ServiceRow>}
   */
  create: (data: any) => 
    apiClient<ServiceRow>(API_ENDPOINTS.services.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route PUT /api/services/:id
   * @auth Bearer
   * @param {string | number} id
   * @param {any} data - UpdateServiceRequest
   * @returns {Promise<ServiceRow>}
   */
  update: (id: string | number, data: any) => 
    apiClient<ServiceRow>(API_ENDPOINTS.services.detail(id.toString()), {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route DELETE /api/services/:id
   * @auth Bearer
   * @param {string | number} id
   * @returns {Promise<void>}
   */
  delete: (id: string | number) => 
    apiClient<void>(API_ENDPOINTS.services.detail(id.toString()), {
      method: "DELETE",
    }),
};
