import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./api.config";

export interface CategoriesProducts {
  id: number;
  name: string;
}

export const CATEGORIES_PRODUCT_API_ENDPOINTS = {
  listCategoriesProducts: `${API_BASE_URL}/api/categories/products`,
};

export const categoriesProductService = {
  /**
   * @route GET /api/categories/products
   * @auth No
   * @returns {Promise<CategoriesProducts[]>}
   */
  listCategoriesProducts: () =>
    apiClient<CategoriesProducts[]>(CATEGORIES_PRODUCT_API_ENDPOINTS.listCategoriesProducts, { method: "GET" }),
};
