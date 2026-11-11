import type { OrderSummary } from "@/services/commerceService";

/** A completed refund takes precedence over an earlier delivery timestamp. */
export function getSaleRefundStatus(
  order: Pick<OrderSummary, "status" | "refunded_amount" | "total_amount">,
): "full" | "partial" | null {
  if (order.status === "refunded") return "full";
  const refunded = Number(order.refunded_amount ?? 0);
  if (!Number.isFinite(refunded) || refunded <= 0) return null;
  const total = Number(order.total_amount ?? 0);
  return total > 0 && refunded >= total ? "full" : "partial";
}
