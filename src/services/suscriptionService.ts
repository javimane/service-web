import { SuscriptionPrice } from "../types/database.types";
import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

export const suscriptions = {
  /**
   * @route GET /api/suscription-price
   * @auth Bearer
   * @returns {Promise<{ data: SuscriptionPrice[] }>}
   */
  getSusciptionPrice: () =>
    apiClient<{
      data: SuscriptionPrice[];
    }>(API_ENDPOINTS.subscriptions.getPrice, {
      method: "GET",
    }),

  getByProfessional: (professionalId: string | number) =>
    apiClient<{
      data: any;
    }>(API_ENDPOINTS.subscriptions.byProfessional(professionalId), {
      method: "GET",
    }),
};
