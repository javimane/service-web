export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    googleLogin: `${API_BASE_URL}/api/auth/login/google`,
    getSession: `${API_BASE_URL}/api/auth/session`,
    updateEmail: `${API_BASE_URL}/api/auth/update-email`,
    updatePassword: `${API_BASE_URL}/api/auth/update-password`,
  },
  users: {
    favorites: `${API_BASE_URL}/api/users/me/favorites`,
    favoriteDetail: (professionalId: string) =>
      `${API_BASE_URL}/api/users/me/favorites/${professionalId}`,
    roles: `${API_BASE_URL}/api/users/roles`,
    benefits: (userId: string) =>
      `${API_BASE_URL}/api/users/${userId}/benefits`,
  },
  professionals: {
    list: `${API_BASE_URL}/api/professionals`,
    categories: (professionalId: string) =>
      `${API_BASE_URL}/api/professional-details/${professionalId}/categories`,
    credentials: (professionalId: string) =>
      `${API_BASE_URL}/api/professional-details/${professionalId}/credentials`,
    schedules: (professionalId: string) =>
      `${API_BASE_URL}/api/professional-details/${professionalId}/schedules`,
    ranking: `${API_BASE_URL}/api/professional-ranking`,
    detail: (id: string) => `${API_BASE_URL}/api/professionals/${id}`,
  },
  proposals: {
    base: `${API_BASE_URL}/api/professional-proposals`,
    sent: `${API_BASE_URL}/api/professional-proposals/sent`,
    received: `${API_BASE_URL}/api/professional-proposals/received`,
    detail: (id: string) => `${API_BASE_URL}/api/professional-proposals/${id}`,
    accept: (id: string) =>
      `${API_BASE_URL}/api/professional-proposals/${id}/accept`,
    count: (professionalId: string | number) =>
      `${API_BASE_URL}/api/professional-proposals/accepted/count/${professionalId}`,
  },
  companies: {
    base: `${API_BASE_URL}/api/companies`,
    detail: (id: string) => `${API_BASE_URL}/api/companies/${id}`,
    byProfessional: (professionalId: string | number) =>
      `${API_BASE_URL}/api/companies/professional/${professionalId}`,
  },
  products: {
    list: `${API_BASE_URL}/api/products`,
    detail: (id: string) => `${API_BASE_URL}/api/products/${id}`,
    byName: (name: string) => `${API_BASE_URL}/api/products/name/${name}`,
    byCategory: (categoryId: number) =>
      `${API_BASE_URL}/api/products/category/${categoryId}`,
    byProfessional: (professionalId: number) =>
      `${API_BASE_URL}/api/products/professional/${professionalId}`,
    onlyProductsByProfessional: (professionalId: number) =>
      `${API_BASE_URL}/api/products/professional/${professionalId}/only-products`,
    updateProfessionalProduct: (professionalId: number, productId: string) =>
      `${API_BASE_URL}/api/products/professional/${professionalId}/product/${productId}`,
    updatePrices: `${API_BASE_URL}/api/products/update-prices`,
    massUpdatePrices: `${API_BASE_URL}/api/products/mass-update-prices`,
    assignProfessional: `${API_BASE_URL}/api/products/assign-professional`,
    unassignProfessional: (productId: string, professionalId: number) =>
      `${API_BASE_URL}/api/products/${productId}/professional/${professionalId}`,
    byEan: (ean: string) => `${API_BASE_URL}/api/products/ean/${ean}`,
  },
  services: {
    list: `${API_BASE_URL}/api/services`,
    base: `${API_BASE_URL}/api/services`,
    detail: (id: string) => `${API_BASE_URL}/api/services/${id}`,
  },
  locations: {
    addresses: `${API_BASE_URL}/api/addresses`,
    provinces: `${API_BASE_URL}/api/provinces`,
    departments: (provinceId: string) =>
      `${API_BASE_URL}/api/province-departments/province/${provinceId}`,
  },
  communications: {
    base: `${API_BASE_URL}/api/communications`,
    userRequests: (userId: string) =>
      `${API_BASE_URL}/api/communications/requests/user/${userId}`,
    professionalRequests: (professionalId: string) =>
      `${API_BASE_URL}/api/communications/requests/professional/${professionalId}`,
  },
  payments: {
    mercadopagoWebhook: `${API_BASE_URL}/api/webhooks/mercadopago`,
  },
  multimedia: {
    uploadUrl: `${API_BASE_URL}/api/videos/upload-url`,
  },
  subscriptions: {
    getPrice: `${API_BASE_URL}/api/subscription-price`,
  },
  reels: {
    base: `${API_BASE_URL}/api/professional-reels`,
    detail: (id: string | number) =>
      `${API_BASE_URL}/api/professional-reels/${id}`,
    stats: (id: string | number) =>
      `${API_BASE_URL}/api/professional-reels/${id}/stats`,
    professionalStats: (professionalId: string | number) =>
      `${API_BASE_URL}/api/professional-reels/professional/${professionalId}/stats`,
  },
  bankPromotions: {
    base: `${API_BASE_URL}/api/bank-promotions`,
    my: `${API_BASE_URL}/api/bank-promotions/my-promotions`,
    detail: (id: string) => `${API_BASE_URL}/api/bank-promotions/${id}`,
  },
  banks: {
    base: `${API_BASE_URL}/api/banks`,
    detail: (id: number) => `${API_BASE_URL}/api/banks/${id}`,
  },
  professionalPromotions: {
    base: `${API_BASE_URL}/api/professional-promotions`,
    byProfessional: (professionalId: string | number) =>
      `${API_BASE_URL}/api/professional-promotions/professional/${professionalId}`,
    detail: (id: string | number) =>
      `${API_BASE_URL}/api/professional-promotions/${id}`,
  },
  storage: {
    products: `${API_BASE_URL}/api/storage/products`,
    promotions: `${API_BASE_URL}/api/storage/promotions`,
    profile: `${API_BASE_URL}/api/storage/profile`,
    portfolio: `${API_BASE_URL}/api/storage/portfolio`,
  },
  profiles: {
    base: `${API_BASE_URL}/api/profiles`,
    detail: (id: string) => `${API_BASE_URL}/api/profiles/${id}`,
  },
  arca: {
    verify: (
      cuit: string,
      companyName: string,
      professionalId: string | number,
    ) =>
      `${API_BASE_URL}/api/arca/verify/${cuit}/${encodeURIComponent(companyName)}/${professionalId}`,
    findByCompanyId: (companyId: number) =>
      `${API_BASE_URL}/api/arca/company/${companyId}`,
  }
};
