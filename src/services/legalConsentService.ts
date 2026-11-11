import { API_BASE_URL } from "./api.config";
import { apiClient } from "./apiClient";
export type LegalConsentStatus = {
  accepted_terms: boolean;
  accepted_privacy: boolean;
  requires_legal_consent: boolean;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
};
export const legalConsentService = {
  get: () =>
    apiClient<LegalConsentStatus>(`${API_BASE_URL}/api/auth/legal-consent`),
  accept: () =>
    apiClient<LegalConsentStatus>(`${API_BASE_URL}/api/auth/legal-consent`, {
      method: "POST",
      body: { terms: true, privacy: true },
    }),
};
