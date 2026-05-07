import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ProfessionalAvailabilityRow } from "../types/database.types";

export interface AvailabilityUpsertItem {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export const availabilityService = {
  /**
   * @route GET /api/professional/availability/professional/:professionalId
   * @auth No
   */
  findByProfessionalId: (professionalId: number) =>
    apiClient<ProfessionalAvailabilityRow[]>(
      API_ENDPOINTS.availability.byProfessional(professionalId),
      { method: "GET" },
    ),

  /**
   * @route POST /api/professional/availability/bulk
   * @auth Bearer + ProfessionalActiveGuard
   */
  upsertBulk: (availability: AvailabilityUpsertItem[]) =>
    apiClient<ProfessionalAvailabilityRow[]>(API_ENDPOINTS.availability.bulk, {
      method: "POST",
      body: JSON.stringify({ availability }),
    }),

  /**
   * @route PUT /api/professional/availability/:id
   * @auth Bearer + ProfessionalActiveGuard
   */
  update: (id: number, data: Partial<AvailabilityUpsertItem>) =>
    apiClient<ProfessionalAvailabilityRow>(
      API_ENDPOINTS.availability.detail(id),
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  /**
   * @route DELETE /api/professional/availability/:id
   * @auth Bearer + ProfessionalActiveGuard
   */
  delete: (id: number) =>
    apiClient<void>(API_ENDPOINTS.availability.detail(id), {
      method: "DELETE",
    }),
};
