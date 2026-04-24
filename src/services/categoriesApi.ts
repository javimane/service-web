import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./api.config";

export const CATEGORIES_API_ENDPOINTS = {
  listCategories: `${API_BASE_URL}/categories`,
  listProfiles: `${API_BASE_URL}/profiles`,
  profileDetail: (profileId: string) => `${API_BASE_URL}/profiles/${profileId}`,
  profilesByCategory: (categorySlug: string) => `${API_BASE_URL}/categories/${categorySlug}/profiles`,
  provinces: `${API_BASE_URL}/locations/provinces`,
  citiesByProvince: (province: string) => `${API_BASE_URL}/locations/cities?province=${encodeURIComponent(province)}`,
  featuredProfiles: (categorySlug: string) => `${API_BASE_URL}/profiles/featured?category=${encodeURIComponent(categorySlug)}`,
};

export const categoriesService = {
  /**
   * @route GET /v1/categories
   * @auth No
   * @returns {Promise<any[]>}
   */
  listCategories: () => 
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.listCategories, { method: "GET" }),

  /**
   * @route GET /v1/profiles
   * @auth No
   * @returns {Promise<any[]>}
   */
  listProfiles: () => 
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.listProfiles, { method: "GET" }),

  /**
   * @route GET /v1/profiles/:profileId
   * @auth No
   * @param {string} profileId
   * @returns {Promise<any>}
   */
  getProfileDetail: (profileId: string) => 
    apiClient<any>(CATEGORIES_API_ENDPOINTS.profileDetail(profileId), { method: "GET" }),

  /**
   * @route GET /v1/categories/:categorySlug/profiles
   * @auth No
   * @param {string} categorySlug
   * @returns {Promise<any[]>}
   */
  getProfilesByCategory: (categorySlug: string) => 
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.profilesByCategory(categorySlug), { method: "GET" }),

  /**
   * @route GET /v1/locations/provinces
   * @auth No
   * @returns {Promise<any[]>}
   */
  getProvinces: () => 
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.provinces, { method: "GET" }),

  /**
   * @route GET /v1/locations/cities?province=:province
   * @auth No
   * @param {string} province
   * @returns {Promise<any[]>}
   */
  getCitiesByProvince: (province: string) => 
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.citiesByProvince(province), { method: "GET" }),

  /**
   * @route GET /v1/profiles/featured?category=:categorySlug
   * @auth No
   * @param {string} categorySlug
   * @returns {Promise<any[]>}
   */
  getFeaturedProfiles: (categorySlug: string) => 
    apiClient<any[]>(CATEGORIES_API_ENDPOINTS.featuredProfiles(categorySlug), { method: "GET" }),
};
