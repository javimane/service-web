import { type Plan } from "./plans";

export type Subscription = {
  id: string;
  planId: string;
  status: "active" | "cancelled" | "past_due";
  startDate: string;
  nextPaymentDate: string;
  amount: number;
};

export const mockSubscription: Subscription = {
  id: "sub_001",
  planId: "profesional-basico",
  status: "active",
  startDate: "2026-01-15",
  nextPaymentDate: "2026-05-15",
  amount: 9990,
};
