import { type Plan } from "./plans";

export type Subscription = {
  id: string;
  plan: string;
  status: "active" | "cancelled";
  startDate: string;
  nextPaymentDate: string;
  amount: number;
};
