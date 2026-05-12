import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

export interface Referral {
  id: number;
  user_id: string;
  referred_email: string;
  created_at: string;
}

export const referralService = {
  listMy: () =>
    apiClient<Referral[]>(API_ENDPOINTS.referrals.my, { method: "GET" }),

  create: (referred_email: string) =>
    apiClient<Referral>(API_ENDPOINTS.referrals.base, {
      method: "POST",
      body: JSON.stringify({ referred_email }),
    }),
};
