import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ProductRow } from "../types/database.types";

export const productService = {
  /**
   * @route GET /api/products
   * @auth No
   * @param {number} [page]
   * @param {number} [limit]
   * @returns {Promise<{ data: ProductRow[]; count: number; page: number; limit: number; totalPages: number }>}
   */
  list: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    
    return apiClient<{ data: ProductRow[]; count: number; page: number; limit: number; totalPages: number }>(`${API_ENDPOINTS.products.list}${queryString}`, {
      method: "GET",
    });
  },
    
  /**
   * @route GET /api/products/:id
   * @auth No
   * @param {string | number} id
   * @returns {Promise<ProductRow>}
   */
  getDetail: (id: string | number) => 
    apiClient<ProductRow>(API_ENDPOINTS.products.detail(id.toString()), {
      method: "GET",
    }),
};
