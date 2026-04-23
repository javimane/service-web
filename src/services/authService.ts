import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

export const authService = {
  /**
   * @route POST /api/auth/register
   * @auth No
   * @param {Object} data - { email: string; password: string }
   * @returns {Promise<any>} Supabase auth response
   */
  register: (data: any) => 
    apiClient(API_ENDPOINTS.auth.register, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route POST /api/auth/login
   * @auth No
   * @param {Object} data - { email: string; password: string }
   * @returns {Promise<any>} Supabase auth response
   */
  login: (data: any) => 
    apiClient(API_ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  /**
   * @route POST /api/auth/login/google
   * @auth No
   * @param {string} token - { access_token: string }
   * @returns {Promise<any>} Supabase auth response
   */
  googleLogin: (token: string) => 
    apiClient(API_ENDPOINTS.auth.googleLogin, {
      method: "POST",
      body: JSON.stringify({ access_token: token }),
    }),
    
  /**
   * @route GET /api/auth/session
   * @auth Bearer (manual)
   * @returns {Promise<any>} Supabase auth response
   */
  getSession: () => 
    apiClient<any>(API_ENDPOINTS.auth.getSession, {
      method: "GET",
    }),
};
