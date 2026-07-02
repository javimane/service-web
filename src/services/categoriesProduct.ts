import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./api.config";

export interface CategoriesProducts {
  id: number;
  name: string;
}

export interface SubCategoriesProducts {
  category_id: number;
  id: string;
  name: string;
}

export const CATEGORIES_PRODUCT_API_ENDPOINTS = {
  listCategoriesProducts: `${API_BASE_URL}/api/categories/products`,
  listSubcategoriesProducts: (categoryId?: number) =>
    `${API_BASE_URL}/api/categories/products/subcategories${
      categoryId !== undefined ? `?categoryId=${categoryId}` : ""
    }`,
  getSubcategoryProductById: (id: string) =>
    `${API_BASE_URL}/api/categories/products/subcategories/${id}`,
};

export const categoriesProductService = {
  /**
   * @route GET /api/categories/products
   * @auth No
   * @returns {Promise<CategoriesProducts[]>}
   */
  listCategoriesProducts: () =>
    apiClient<CategoriesProducts[]>(
      CATEGORIES_PRODUCT_API_ENDPOINTS.listCategoriesProducts,
      { method: "GET" },
    ),

  /**
   * @route GET /api/categories/products/subcategories
   * @auth No
   * @param {number} [categoryId]
   * @returns {Promise<SubCategoriesProducts[]>}
   */
  listSubcategoriesProducts: (categoryId?: number) =>
    apiClient<SubCategoriesProducts[]>(
      CATEGORIES_PRODUCT_API_ENDPOINTS.listSubcategoriesProducts(categoryId),
      { method: "GET" },
    ),

  /**
   * @route GET /api/categories/products/subcategories/:id
   * @auth No
   * @param {string} id
   * @returns {Promise<SubCategoriesProducts>}
   */
  getSubcategoryProductById: (id: string) =>
    apiClient<SubCategoriesProducts>(
      CATEGORIES_PRODUCT_API_ENDPOINTS.getSubcategoryProductById(id),
      { method: "GET" },
    ),
};
