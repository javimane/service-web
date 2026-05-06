import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ProfessionalImageRow } from "../types/database.types";

export type CreateProfessionalImageRequest = {
  image_url: string;
  caption?: string;
  display_order?: number;
};

export const professionalImagesService = {
  findAllByProfessionalId: (professionalId: number) =>
    apiClient<ProfessionalImageRow[]>(
      API_ENDPOINTS.professionalImages.byProfessional(professionalId),
      { method: "GET" }
    ),

  findById: (id: string) =>
    apiClient<ProfessionalImageRow>(API_ENDPOINTS.professionalImages.detail(id), {
      method: "GET",
    }),

  create: (data: CreateProfessionalImageRequest) =>
    apiClient<ProfessionalImageRow>(API_ENDPOINTS.professionalImages.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<void>(API_ENDPOINTS.professionalImages.detail(id), {
      method: "DELETE",
    }),
};
