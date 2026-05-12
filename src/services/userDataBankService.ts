import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

export interface UserDataBank {
  id: number;
  user_id: string;
  cbu: string;
  alias: string;
  created_at: string;
  updated_at: string;
}

export const userDataBankService = {
  getMy: () =>
    apiClient<UserDataBank | null>(API_ENDPOINTS.userDataBank.my, { method: "GET" }),

  upsert: (data: { cbu: string; alias: string }) =>
    apiClient<UserDataBank>(API_ENDPOINTS.userDataBank.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
