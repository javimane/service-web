import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { AddressRow, ProvinceRow, ProvinceDepartmentRow } from "../types/database.types";

export const locationService = {
  /**
   * @route GET /api/addresses
   * @auth No
   * @returns {Promise<any[]>}
   */
  getAddresses: () => 
    apiClient<any[]>(API_ENDPOINTS.locations.addresses, {
      method: "GET",
    }),
    
  /**
   * @route GET /api/addresses/my
   * @auth Bearer
   * @returns {Promise<AddressRow[]>}
   */
  getMyAddresses: () => 
    apiClient<AddressRow[]>(`${API_ENDPOINTS.locations.addresses}/my`, {
      method: "GET",
    }),
    
  /**
   * @route GET /api/addresses/professional/:professionalId
   * @auth No
   * @param {string | number} professionalId
   * @returns {Promise<AddressRow[]>}
   */
  getProfessionalAddresses: (professionalId: string | number) => 
    apiClient<AddressRow[]>(`${API_ENDPOINTS.locations.addresses}/professional/${professionalId}`, {
      method: "GET",
    }),
    
  /**
   * @route POST /api/addresses
   * @auth Bearer
   * @param {Partial<AddressRow>} data
   * @returns {Promise<AddressRow>}
   */
  saveAddress: (data: Partial<AddressRow>) => 
    apiClient<AddressRow>(API_ENDPOINTS.locations.addresses, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route PUT /api/addresses/:id
   * @auth Bearer
   * @param {string | number} id
   * @param {Partial<AddressRow>} data
   * @returns {Promise<AddressRow>}
   */
  updateAddress: (id: string | number, data: Partial<AddressRow>) => 
    apiClient<AddressRow>(`${API_ENDPOINTS.locations.addresses}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route GET /api/provinces
   * @auth No
   * @returns {Promise<ProvinceRow[]>}
   */
  getProvinces: () => 
    apiClient<ProvinceRow[]>(API_ENDPOINTS.locations.provinces, {
      method: "GET",
    }),
    
  /**
   * @route GET /api/province-departments/province/:provinceId
   * @auth No
   * @param {string | number} provinceId
   * @returns {Promise<ProvinceDepartmentRow[]>}
   */
  getDepartments: (provinceId: string | number) => 
    apiClient<ProvinceDepartmentRow[]>(API_ENDPOINTS.locations.departments(provinceId.toString()), {
      method: "GET",
    }),
};
