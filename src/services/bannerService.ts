import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "./api.config";

export interface ApiBanner {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  route?: string | null;
  title?: string | null;
  subtitle?: string | null;
  position?: number;
  isActive?: boolean;
}

export const bannerService = {
  getActiveBanners: async (): Promise<ApiBanner[]> => {
    try {
      const endpoint = API_ENDPOINTS.banners?.base;
      if (!endpoint) return [];
      const res = await apiClient<ApiBanner[] | { data: ApiBanner[] }>(endpoint);
      if (Array.isArray(res)) return res.filter((b) => b && b.imageUrl);
      if (res && Array.isArray((res as any).data)) {
        return (res as any).data.filter((b: any) => b && b.imageUrl);
      }
      return [];
    } catch {
      return [];
    }
  },
};
