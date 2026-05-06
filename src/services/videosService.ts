import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ProfessionalVideoRow } from "../types/database.types";

export const videosService = {
  list: () => {
    return apiClient<ProfessionalVideoRow[]>(API_ENDPOINTS.videos.base, {
      method: "GET",
    });
  },

  getById: (id: string) =>
    apiClient<ProfessionalVideoRow>(API_ENDPOINTS.videos.detail(id), {
      method: "GET",
    }),

  create: (data: Partial<ProfessionalVideoRow>) =>
    apiClient<ProfessionalVideoRow>(API_ENDPOINTS.videos.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<void>(API_ENDPOINTS.videos.detail(id), {
      method: "DELETE",
    }),
};
