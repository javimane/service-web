export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.localcomercial.dev";

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    googleLogin: `${API_BASE_URL}/api/auth/login/google`,
    getSession: `${API_BASE_URL}/api/auth/session`,
  },
  users: {
    favorites: `${API_BASE_URL}/api/users/me/favorites`,
    favoriteDetail: (professionalId: string) => `${API_BASE_URL}/api/users/me/favorites/${professionalId}`,
    roles: `${API_BASE_URL}/api/users/roles`,
    benefits: (userId: string) => `${API_BASE_URL}/api/users/${userId}/benefits`,
  },
  professionals: {
    list: `${API_BASE_URL}/api/professionals`,
    categories: (professionalId: string) => `${API_BASE_URL}/api/professional-details/${professionalId}/categories`,
    credentials: (professionalId: string) => `${API_BASE_URL}/api/professional-details/${professionalId}/credentials`,
    schedules: (professionalId: string) => `${API_BASE_URL}/api/professional-details/${professionalId}/schedules`,
    ranking: `${API_BASE_URL}/api/professional-ranking`,
  },
  proposals: {
    base: `${API_BASE_URL}/api/professional-proposals`,
    sent: `${API_BASE_URL}/api/professional-proposals/sent`,
    received: `${API_BASE_URL}/api/professional-proposals/received`,
    detail: (id: string) => `${API_BASE_URL}/api/professional-proposals/${id}`,
    accept: (id: string) => `${API_BASE_URL}/api/professional-proposals/${id}/accept`,
  },
  companies: {
    base: `${API_BASE_URL}/api/companies`,
    detail: (id: string) => `${API_BASE_URL}/api/companies/${id}`,
  },
  products: {
    list: `${API_BASE_URL}/api/products`,
    detail: (id: string) => `${API_BASE_URL}/api/products/${id}`,
  },
  services: {
    list: `${API_BASE_URL}/api/services`,
    base: `${API_BASE_URL}/api/services`,
    detail: (id: string) => `${API_BASE_URL}/api/services/${id}`,
  },
  locations: {
    addresses: `${API_BASE_URL}/api/addresses`,
    provinces: `${API_BASE_URL}/api/provinces`,
    departments: (provinceId: string) => `${API_BASE_URL}/api/province-departments/province/${provinceId}`,
  },
  communications: {
    base: `${API_BASE_URL}/api/communications`,
    userRequests: (userId: string) => `${API_BASE_URL}/api/communications/requests/user/${userId}`,
    professionalRequests: (professionalId: string) => `${API_BASE_URL}/api/communications/requests/professional/${professionalId}`,
  },
  payments: {
    mercadopagoWebhook: `${API_BASE_URL}/api/webhooks/mercadopago`,
  },
  multimedia: {
    uploadUrl: `${API_BASE_URL}/api/videos/upload-url`,
  },
};
