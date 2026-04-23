import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { CompanyRow } from "../types/database.types";

export const companyService = {
  /**
   * @route GET /api/companies
   * @auth No
   * @returns {Promise<CompanyRow[]>}
   */
  list: () => 
    apiClient<CompanyRow[]>(API_ENDPOINTS.companies.base, {
      method: "GET",
    }),
    
  /**
   * @route GET /api/companies/:id
   * @auth No
   * @param {string | number} id
   * @returns {Promise<CompanyRow>}
   */
  getDetail: (id: string | number) => 
    apiClient<CompanyRow>(API_ENDPOINTS.companies.detail(id.toString()), {
      method: "GET",
    }),
    
  /**
   * @route POST /api/companies
   * @auth Bearer
   * @param {any} data - CreateCompanyRequest
   * @returns {Promise<CompanyRow>}
   */
  create: (data: any) => 
    apiClient<CompanyRow>(API_ENDPOINTS.companies.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route PUT /api/companies/:id
   * @auth Bearer
   * @param {string | number} id
   * @param {any} data - UpdateCompanyRequest
   * @returns {Promise<CompanyRow>}
   */
  update: (id: string | number, data: any) => 
    apiClient<CompanyRow>(API_ENDPOINTS.companies.detail(id.toString()), {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
