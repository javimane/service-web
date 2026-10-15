import axiosInstance from "./apiClient";
import { API_ENDPOINTS } from "./api.config";

export type ListingReportTarget = "professional_product" | "professional_publication" | string;
export type ListingReportReason =
  | "counterfeit"
  | "adulterated"
  | "misleading"
  | "prohibited"
  | "inappropriate"
  | "other"
  | string;
export type ListingReportStatus = "pending" | "in_review" | "dismissed" | "actioned" | string;

export interface ListingReportSnapshot {
  title?: string | null;
  description?: string | null;
  price?: number | null;
  product_condition?: string | null;
  images?: string[];
  [key: string]: any;
}

export interface ListingReportItem {
  id: string;
  target_type: ListingReportTarget;
  target_id: string;
  target_title?: string | null;
  target_snapshot?: ListingReportSnapshot | null;
  reason: ListingReportReason;
  details?: string | null;
  status: ListingReportStatus;
  created_at: string;
  reviewed_at?: string | null;
  resolution_note?: string | null;
  admin_notes?: string | null;
  [key: string]: any;
}

export const listingReportsService = {
  async getMyReports(): Promise<ListingReportItem[]> {
    const response = await axiosInstance.get<ListingReportItem[] | { data?: ListingReportItem[]; items?: ListingReportItem[] }>(
      API_ENDPOINTS.listingReports.mine
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray((response.data as any).data)) {
      return (response.data as any).data;
    }
    if (response.data && Array.isArray((response.data as any).items)) {
      return (response.data as any).items;
    }
    return [];
  },
};
