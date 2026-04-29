import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

export interface ProfessionalPromotion {
  id: string;
  title: string;
  description: string;
  professional_name: string;
  valid_from: string;
  valid_to: string;
  unlimited_stock: boolean;
  discount_type: 'percentage' | 'fixed' | 'bogo' | 'free';
  discount_value: number;
  applicable_to: string;
  image_url: string;
  state: string;
  professional_id: number;
  created_at: string;
}

export interface CreateProfessionalPromotionRequest {
  title: string;
  description: string;
  professional_name: string;
  valid_from: string;
  valid_to: string;
  unlimited_stock: boolean;
  discount_type: string;
  discount_value: number;
  applicable_to: string;
  image_url: string;
}

export const professionalPromotionService = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_ENDPOINTS.professionalPromotions.base}?${query}` : API_ENDPOINTS.professionalPromotions.base;
    return apiClient<ProfessionalPromotion[]>(url);
  },

  getByProfessional: async (professionalId: string | number) => {
    return apiClient<ProfessionalPromotion[]>(API_ENDPOINTS.professionalPromotions.byProfessional(professionalId));
  },

  getById: async (id: string | number) => {
    return apiClient<ProfessionalPromotion>(API_ENDPOINTS.professionalPromotions.detail(id));
  },

  create: async (data: CreateProfessionalPromotionRequest) => {
    return apiClient<ProfessionalPromotion>(API_ENDPOINTS.professionalPromotions.base, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string | number, data: Partial<CreateProfessionalPromotionRequest>) => {
    return apiClient<ProfessionalPromotion>(API_ENDPOINTS.professionalPromotions.detail(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string | number) => {
    return apiClient<void>(API_ENDPOINTS.professionalPromotions.detail(id), {
      method: "DELETE",
    });
  },
};
