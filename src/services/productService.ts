import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type {
  ProductRow,
  ProductWithAssociation,
  ProfessionalProductRow,
} from "../types/database.types";

export interface CreateProductRequest {
  ean: string;
  name: string;
  description?: string;
  brand?: string;
  image_url?: string[];
  display_order?: number[];
  categories_products_id?: number;
  sub_categories_products_id?: string;
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
  image_url?: string[];
  images_to_save?: string[];
  images_to_delete?: string[];
  display_order?: number[];
  categories_products_id?: number;
  sub_categories_products_id?: string;
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
   * @returns {Promise<{ data: ProfessionalProductRow[]; count: number; page: number; limit: number; totalPages: number }>}
   */
  list: (params?: any) => {
    const urlParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== undefined &&
          params[key] !== null &&
          params[key] !== ""
        ) {
          urlParams.append(key, params[key].toString());
        }
      });
    }
    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";

    return apiClient<{
      data: any[];
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
   * @returns {Promise<ProfessionalProductRow>}
   */
  getDetail: (id: string | number) =>
    apiClient<ProductWithAssociation>(
      API_ENDPOINTS.products.detail(id.toString()),
      {
        method: "GET",
      },
    ),

  /**
   * @route GET /api/products/name/:name
   * @auth No
   * @param {string} name
   * @returns {Promise<ProfessionalProductRow[]>}
   */
  getByName: (name: string) =>
    apiClient<ProfessionalProductRow[]>(API_ENDPOINTS.products.byName(name), {
      method: "GET",
    }),

  /**
   * @route GET /api/products/ean/:ean
   * @auth No
   * @param {string} ean
   * @param {number} [professionalId]
   * @returns {Promise<ProfessionalProductRow>}
   */
  getByEan: (ean: string, professionalId?: number) => {
    const query = professionalId ? `?professionalId=${professionalId}` : "";
    return apiClient<ProfessionalProductRow>(
      `${API_ENDPOINTS.products.byEan(ean)}${query}`,
      {
        method: "GET",
      },
    );
  },

  /**
   * @route GET /api/products/category/:categoryId
   * @auth No
   * @param {number} categoryId
   * @returns {Promise<ProfessionalProductRow[]>}
   */
  getByCategory: (categoryId: number) =>
    apiClient<ProfessionalProductRow[]>(
      API_ENDPOINTS.products.byCategory(categoryId),
      {
        method: "GET",
      },
    ),

  /**
   * @route GET /api/products/professional/:professionalId
   * @auth No
   * @param {number} professionalId
   * @returns {Promise<ProfessionalProductRow[]>}
   */
  getByProfessional: (professionalId: number) =>
    apiClient<ProfessionalProductRow[]>(
      API_ENDPOINTS.products.byProfessional(professionalId),
      {
        method: "GET",
      },
    ),

  /**
   * @route GET /api/products/professional/:professionalId/only-products
   * @auth No
   * @param {number} professionalId
   * @returns {Promise<ProfessionalProductRow[]>}
   */
  getOnlyProductsByProfessional: (professionalId: number) =>
    apiClient<ProfessionalProductRow[]>(
      API_ENDPOINTS.products.onlyProductsByProfessional(professionalId),
      {
        method: "GET",
      },
    ),

  /**
   * @route POST /api/products
   * @auth Bearer
   * @param {CreateProductRequest} data
   * @returns {Promise<ProfessionalProductRow>}
   */
  create: (data: CreateProductRequest) =>
    apiClient<ProfessionalProductRow>(API_ENDPOINTS.products.list, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * @route PUT /api/products/:id
   * @auth Bearer
   * @param {string} id
   * @param {UpdateProductRequest} data
   * @returns {Promise<ProfessionalProductRow>}
   */
  update: (id: string, data: UpdateProductRequest) =>
    apiClient<ProfessionalProductRow>(API_ENDPOINTS.products.detail(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * @route PUT /api/products/professional/:professionalId/product/:productId
   * @auth Bearer
   * @param {number} professionalId
   * @param {string} productId
   * @param {any} updates
   * @returns {Promise<ProfessionalProductRow>}
   */
  updateProfessionalProduct: (
    professionalId: number,
    productId: string,
    updates: any,
  ) =>
    apiClient<ProfessionalProductRow>(
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
   * @returns {Promise<ProfessionalProductRow[]>}
   */
  updatePriceToMany: (data: UpdatePriceToManyRequest) =>
    apiClient<ProfessionalProductRow[]>(API_ENDPOINTS.products.updatePrices, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * @route PUT /api/products/mass-update-prices
   * @auth Bearer
   * @param {MassUpdatePriceRequest} data
   * @returns {Promise<ProfessionalProductRow[]>}
   */
  massUpdatePrice: (data: MassUpdatePriceRequest) =>
    apiClient<ProfessionalProductRow[]>(
      API_ENDPOINTS.products.massUpdatePrices,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  /**
   * @route POST /api/products/assign-professional
   * @auth Bearer
   * @param {AssignProductToProfessionalRequest} data
   * @returns {Promise<ProfessionalProductRow>}
   */
  assignToProfessional: (data: AssignProductToProfessionalRequest) =>
    apiClient<ProfessionalProductRow>(
      API_ENDPOINTS.products.assignProfessional,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

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
