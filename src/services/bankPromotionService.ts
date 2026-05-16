import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "./api.config";
import { CompanyRow, ProfessionalRow } from "../types/database.types";

export interface Bank {
  id: number;
  name: string;
}

export interface BankPromotion {
  id: string;
  percentaje_discount: number;
  refund: number;
  bank_id?: number | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  from_date: string;
  expiration_date: string;
  description?: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  payment_method?: string | null;
  terms_conditions?: string | null;
  minimum_amount?: number | null;
  with_interest?: boolean | null;
  installments?: number | null;
  Bank?: Bank;
  bank_promotions_banks?: Array<{
    bank_id: number;
    Bank?: Bank;
  }>;
  Professional?: {
    id: number;
    Company?: Array<{
      id: number;
      name: string;
      company_provinces?: Array<{ province_id: number }>;
      CompanyProvinces?: Array<{ province_id: number }>;
    }>;
    Profile?: {
      avatar_url: string | null;
    };
    address?: Array<{
      province_id: number;
      department_id: number;
    }>;
  };
  province_id?: number;
  seo_path?: string;
}

export type CreateBankPromotionDto = Omit<
  BankPromotion,
  | "id"
  | "profile_id"
  | "created_at"
  | "updated_at"
  | "Bank"
  | "bank_promotions_banks"
  | "Professional"
> & {
  bankIds?: number[];
};

export const bankPromotionService = {
  getAll: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const url = query
      ? `${API_ENDPOINTS.bankPromotions.base}?${query}`
      : API_ENDPOINTS.bankPromotions.base;
    return apiClient<BankPromotion[]>(url);
  },

  getMyPromotions: () =>
    apiClient<BankPromotion[]>(API_ENDPOINTS.bankPromotions.my),

  getById: (id: string) =>
    apiClient<BankPromotion>(API_ENDPOINTS.bankPromotions.detail(id)),

  create: (data: CreateBankPromotionDto) =>
    apiClient<BankPromotion>(API_ENDPOINTS.bankPromotions.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateBankPromotionDto>) =>
    apiClient<BankPromotion>(API_ENDPOINTS.bankPromotions.detail(id), {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<void>(API_ENDPOINTS.bankPromotions.detail(id), {
      method: "DELETE",
    }),
};

export const bankService = {
  findAll: () => apiClient<Bank[]>(API_ENDPOINTS.banks.base),

  getById: (id: number) => apiClient<Bank>(API_ENDPOINTS.banks.detail(id)),
};
