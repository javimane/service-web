import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

export interface ProfessionalPromotion {
  id: string;
  title: string;
  description: string;
  from_date: string | null;
  expires_at: string | null;
  unlimited_stock: boolean | null;
  discount_type: string | null;
  discount_value: number | null;
  applicable_to: string | null;
  image_url: string | null;
  state: string | null;
  professional_id: number;
  created_at: string;
  updated_at: string;
  Professional?: {
    id: number;
    Company?: { name: string };
    Profile?: {
      avatar_url: string | null;
    };
  };
}

export interface CreateProfessionalPromotionRequest {
  id?: string;
  professional_id: number;
  title: string;
  description: string;
  from_date: string | null;
  expires_at: string | null;
  unlimited_stock: boolean | null;
  discount_type: string | null;
  discount_value: number | null;
  applicable_to: string | null;
  image_url: string | null;
  state: string | null;
  discount_percentage?: number; // Keep as optional for backward compatibility or if backend needs it
  created_at?: string;
  updated_at?: string;
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
