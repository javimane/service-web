import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import type { ProfessionalProposalRow } from "../types/database.types";

export const proposalService = {
  /**
   * @route POST /api/professional-proposals
   * @auth Bearer
   * @param {Partial<ProfessionalProposalRow>} data
   * @returns {Promise<ProfessionalProposalRow>}
   */
  create: (data: Partial<ProfessionalProposalRow>) =>
    apiClient<ProfessionalProposalRow>(API_ENDPOINTS.proposals.base, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * @route GET /api/professional-proposals/sent
   * @auth Bearer
   * @returns {Promise<ProfessionalProposalRow[]>}
   */
  getSent: () =>
    apiClient<ProfessionalProposalRow[]>(API_ENDPOINTS.proposals.sent, {
      method: "GET",
    }),

  /**
   * @route GET /api/professional-proposals/received
   * @auth Bearer
   * @returns {Promise<ProfessionalProposalRow[]>}
   */
  getReceived: () =>
    apiClient<ProfessionalProposalRow[]>(API_ENDPOINTS.proposals.received, {
      method: "GET",
    }),

  /**
   * @route GET /api/professional-proposals/:id
   * @auth Bearer
   * @param {string} id
   * @returns {Promise<ProfessionalProposalRow>}
   */
  getDetail: (id: string) =>
    apiClient<ProfessionalProposalRow>(API_ENDPOINTS.proposals.detail(id), {
      method: "GET",
    }),

  /**
   * @route POST /api/professional-proposals/:id/accept
   * @auth Bearer
   * @param {string} id
   * @returns {Promise<ProfessionalProposalRow | any>}
   */
  accept: (id: string) =>
    apiClient<any>(API_ENDPOINTS.proposals.accept(id), {
      method: "POST",
    }),

  /**
   * @route GET /api/professional-proposals/accepted/count/:professionalId
   * @auth Bearer
   * @param {string | number} professionalId
   * @returns {Promise<{ count: number }>}
   */
  getCount: (professionalId: string | number) =>
    apiClient<{ count: number }>(
      API_ENDPOINTS.proposals.count(professionalId),
      {
        method: "GET",
      },
    ),
};
