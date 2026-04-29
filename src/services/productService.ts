import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ProductRow } from "../types/database.types";

export interface CreateProductRequest {
  ean: string;
  name: string;
  description?: string;
  brand?: string;
  image_url?: string;
  categories_products_id?: number;
  // Professional relationship fields (handled in same request by API)
  professional_id?: number;
  price?: number;
  sale_type?: string;
  is_active?: boolean;
  stock?: number;
  offer_price?: number;
}

export interface UpdateProductRequest {
  ean?: string;
  name?: string;
  description?: string;
  brand?: string;
  image_url?: string;
  categories_products_id?: number;
}

export interface UpdatePriceToManyRequest {
  productIds: string[];
  professionalId: number;
  price: number;
}

export interface AssignProductToProfessionalRequest {
  professional_id: number;
  product_id: string;
  price: number;
  sale_type: string;
  is_active?: boolean;
  stock?: number;
  offer_price?: number;
}

export interface MassUpdatePriceRequest {
  professionalId: number;
  type: "percentage" | "fixed";
  value: number;
  operation: "add" | "subtract";
  delete_offer_price?: boolean;
}

export const productService = {
  /**
   * @route GET /api/products
   * @auth No
   * @param {Object} [params]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @param {string} [params.ean]
   * @returns {Promise<{ data: ProductRow[]; count: number; page: number; limit: number; totalPages: number }>}
   */
  list: (params?: { page?: number; limit?: number; ean?: string }) => {
    const urlParams = new URLSearchParams();
    if (params?.page) urlParams.append("page", params.page.toString());
    if (params?.limit) urlParams.append("limit", params.limit.toString());
    if (params?.ean) urlParams.append("ean", params.ean);
    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";

    return apiClient<{
      data: ProductRow[];
      count: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${API_ENDPOINTS.products.list}${queryString}`, {
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

  /**
   * @route GET /api/products/name/:name
   * @auth No
   * @param {string} name
   * @returns {Promise<ProductRow[]>}
   */
  getByName: (name: string) =>
    apiClient<ProductRow[]>(API_ENDPOINTS.products.byName(name), {
      method: "GET",
    }),

  /**
   * @route GET /api/products/ean/:ean
   * @auth No
   * @param {string} ean
   * @param {number} [professionalId]
   * @returns {Promise<any>}
   */
  getByEan: (ean: string, professionalId?: number) => {
    const query = professionalId ? `?professionalId=${professionalId}` : "";
    return apiClient<any>(`${API_ENDPOINTS.products.byEan(ean)}${query}`, {
      method: "GET",
    });
  },

  /**
   * @route GET /api/products/category/:categoryId
   * @auth No
   * @param {number} categoryId
   * @returns {Promise<ProductRow[]>}
   */
  getByCategory: (categoryId: number) =>
    apiClient<ProductRow[]>(API_ENDPOINTS.products.byCategory(categoryId), {
      method: "GET",
    }),

  /**
   * @route GET /api/products/professional/:professionalId
   * @auth No
   * @param {number} professionalId
   * @returns {Promise<any[]>}
   */
  getByProfessional: (professionalId: number) =>
    apiClient<any[]>(API_ENDPOINTS.products.byProfessional(professionalId), {
      method: "GET",
    }),

  /**
   * @route GET /api/products/professional/:professionalId/only-products
   * @auth No
   * @param {number} professionalId
   * @returns {Promise<ProductRow[]>}
   */
  getOnlyProductsByProfessional: (professionalId: number) =>
    apiClient<ProductRow[]>(
      API_ENDPOINTS.products.onlyProductsByProfessional(professionalId),
      {
        method: "GET",
      },
    ),

  /**
   * @route POST /api/products
   * @auth Bearer
   * @param {CreateProductRequest} data
   * @returns {Promise<ProductRow>}
   */
  create: (data: CreateProductRequest) =>
    apiClient<ProductRow>(API_ENDPOINTS.products.list, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * @route PUT /api/products/:id
   * @auth Bearer
   * @param {string} id
   * @param {UpdateProductRequest} data
   * @returns {Promise<ProductRow>}
   */
  update: (id: string, data: UpdateProductRequest) =>
    apiClient<ProductRow>(API_ENDPOINTS.products.detail(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * @route PUT /api/products/professional/:professionalId/product/:productId
   * @auth Bearer
   * @param {number} professionalId
   * @param {string} productId
   * @param {any} updates
   * @returns {Promise<any>}
   */
  updateProfessionalProduct: (
    professionalId: number,
    productId: string,
    updates: any,
  ) =>
    apiClient<any>(
      API_ENDPOINTS.products.updateProfessionalProduct(
        professionalId,
        productId,
      ),
      {
        method: "PUT",
        body: JSON.stringify(updates),
      },
    ),

  /**
   * @route PUT /api/products/update-prices
   * @auth Bearer
   * @param {UpdatePriceToManyRequest} data
   * @returns {Promise<any>}
   */
  updatePriceToMany: (data: UpdatePriceToManyRequest) =>
    apiClient<any>(API_ENDPOINTS.products.updatePrices, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * @route PUT /api/products/mass-update-prices
   * @auth Bearer
   * @param {MassUpdatePriceRequest} data
   * @returns {Promise<any>}
   */
  massUpdatePrice: (data: MassUpdatePriceRequest) =>
    apiClient<any>(API_ENDPOINTS.products.massUpdatePrices, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * @route POST /api/products/assign-professional
   * @auth Bearer
   * @param {AssignProductToProfessionalRequest} data
   * @returns {Promise<any>}
   */
  assignToProfessional: (data: AssignProductToProfessionalRequest) =>
    apiClient<any>(API_ENDPOINTS.products.assignProfessional, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * @route DELETE /api/products/:productId/professional/:professionalId
   * @auth Bearer
   * @param {string} productId
   * @param {number} professionalId
   * @returns {Promise<void>}
   */
  unassignFromProfessional: (productId: string, professionalId: number) =>
    apiClient<void>(
      API_ENDPOINTS.products.unassignProfessional(productId, professionalId),
      {
        method: "DELETE",
      },
    ),
};
