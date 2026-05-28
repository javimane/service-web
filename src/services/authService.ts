import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

type LoginRequest = {
  email: string;
  password: string;
};

type AuthUserMetadata = {
  email: string;
  email_verified: boolean;
  full_name: string;
  phone_verified: boolean;
  sub: string;
};

type AuthIdentity = {
  identity_id: string;
  id: string;
  user_id: string;
  identity_data: AuthUserMetadata;
  provider: string;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
  email: string;
};

type AuthUser = {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmation_sent_at: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: AuthUserMetadata;
  identities: AuthIdentity[];
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
};

type AuthSession = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: AuthUser;
  weak_password: unknown | null;
};

type SessionSubscription = {
  id: number;
  professional_id: number;
  plan: string;
  status: string;
  amount_paid: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  data: {
    user: AuthUser;
    session: AuthSession;
  };
  error: unknown | null;
  sessionStatus: {
    is_professional: boolean;
    status?: boolean | string;
    professional_active: boolean;
    subscription: SessionSubscription | null;
  };
};

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
   * @returns {Promise<LoginResponse>} Supabase auth response
   */
  login: (data: LoginRequest) =>
    apiClient<LoginResponse>(API_ENDPOINTS.auth.login, {
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
   * @auth Cookie
   * @returns {Promise<any>} Supabase auth response
   */
  getSession: () =>
    apiClient<any>(API_ENDPOINTS.auth.getSession, {
      method: "GET",
    }),

  /**
   * @route POST /api/auth/refresh
   * @auth Cookie
   * @returns {Promise<any>}
   */
  refresh: () =>
    apiClient<any>((process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000") + "/api/auth/refresh", {
      method: "POST",
    }),

  /**
   * @route POST /api/auth/logout
   * @auth Cookie
   * @returns {Promise<any>}
   */
  logout: () =>
    apiClient<any>((process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000") + "/api/auth/logout", {
      method: "POST",
    }),

  /**
   * @route PUT /api/auth/update-email
   * @auth Bearer
   * @param {string} newEmail
   * @returns {Promise<any>}
   */
  updateEmail: (newEmail: string) =>
    apiClient(API_ENDPOINTS.auth.updateEmail, {
      method: "PUT",
      body: JSON.stringify({ email: newEmail }),
    }),

  /**
   * @route PUT /api/auth/update-password
   * @auth Bearer
   * @param {string} newPassword
   * @returns {Promise<any>}
   */
  updatePassword: (newPassword: string) =>
    apiClient(API_ENDPOINTS.auth.updatePassword, {
      method: "PUT",
      body: JSON.stringify({ password: newPassword }),
    }),
};
