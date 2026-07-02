import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./api.config";

export const CATEGORIES_API_ENDPOINTS = {
  listCategoriesProducts: `${API_BASE_URL}/api/categories/products`,
  listSubcategoriesProducts: (categoryId?: number) =>
    `${API_BASE_URL}/api/categories/products/subcategories${
      categoryId !== undefined ? `?categoryId=${categoryId}` : ""
    }`,
  subcategoryProductDetail: (id: string) =>
    `${API_BASE_URL}/api/categories/products/subcategories/${id}`,
  listCategoryServices: `${API_BASE_URL}/api/categories/services`,
  listProfiles: `${API_BASE_URL}/api/profiles`,
  profileDetail: (profileId: string) =>
    `${API_BASE_URL}/api/profiles/${profileId}`,
  profilesByCategory: (categorySlug: string) =>
    `${API_BASE_URL}/api/categories/${categorySlug}/profiles`,
  provinces: `${API_BASE_URL}/api/locations/provinces`,
  citiesByProvince: (province: string) =>
    `${API_BASE_URL}/api/locations/cities?province=${encodeURIComponent(province)}`,
  featuredProfiles: (categorySlug: string) =>
    `${API_BASE_URL}/api/profiles/featured?category=${encodeURIComponent(categorySlug)}`,
};

export const categoriesService = {
  /**
   * @route GET /api/categories
   * @auth No
   * @returns {Promise<any[]>}
   */
  listCategoriesProducts: () =>
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.listCategoriesProducts, {
      method: "GET",
    }),

  /**
   * @route GET /api/categories/products/subcategories
   * @auth No
   * @param {number} [categoryId]
   * @returns {Promise<any[]>}
   */
  listSubcategoriesProducts: (categoryId?: number) =>
    apiClient<any[]>(
      CATEGORIES_API_ENDPOINTS.listSubcategoriesProducts(categoryId),
      { method: "GET" },
    ),

  /**
   * @route GET /api/categories/products/subcategories/:id
   * @auth No
   * @param {string} id
   * @returns {Promise<any>}
   */
  getSubcategoryProductDetail: (id: string) =>
    apiClient<any>(CATEGORIES_API_ENDPOINTS.subcategoryProductDetail(id), {
      method: "GET",
    }),

  /**
   * @route GET /api/categories/services
   * @auth No
   * @returns {Promise<any[]>}
   */
  listCategoryServices: () =>
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.listCategoryServices, {
      method: "GET",
    }),

  /**
   * @route GET /api/profiles
   * @auth No
   * @returns {Promise<any[]>}
   */
  listProfiles: () =>
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.listProfiles, { method: "GET" }),

  /**
   * @route GET /api/profiles/:profileId
   * @auth No
   * @param {string} profileId
   * @returns {Promise<any>}
   */
  getProfileDetail: (profileId: string) =>
    apiClient<any>(CATEGORIES_API_ENDPOINTS.profileDetail(profileId), {
      method: "GET",
    }),

  /**
   * @route GET /api/categories/:categorySlug/profiles
   * @auth No
   * @param {string} categorySlug
   * @returns {Promise<any[]>}
   */
  getProfilesByCategory: (categorySlug: string) =>
    apiClient<any[]>(
      CATEGORIES_API_ENDPOINTS.profilesByCategory(categorySlug),
      { method: "GET" },
    ),

  /**
   * @route GET /api/locations/provinces
   * @auth No
   * @returns {Promise<any[]>}
   */
  getProvinces: () =>
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.provinces, { method: "GET" }),

  /**
   * @route GET /api/locations/cities?province=:province
   * @auth No
   * @param {string} province
   * @returns {Promise<any[]>}
   */
  getCitiesByProvince: (province: string) =>
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.citiesByProvince(province), {
      method: "GET",
    }),

  /**
   * @route GET /api/profiles/featured?category=:categorySlug
   * @auth No
   * @param {string} categorySlug
   * @returns {Promise<any[]>}
   */
  getFeaturedProfiles: (categorySlug: string) =>
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.featuredProfiles(categorySlug), {
      method: "GET",
    }),
};
