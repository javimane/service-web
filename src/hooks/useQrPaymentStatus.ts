import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { commerceService, type OrderStatus } from "@/services/commerceService";

const PAID_STATUSES = new Set<OrderStatus>([
  "paid",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "ready_for_dispatch",
  "dispatched",
  "in_transit",
  "delivered",
  "settled",
]);

export function isQrPaymentConfirmed(status?: OrderStatus | null): boolean {
  return Boolean(status && PAID_STATUSES.has(status));
}

export function useQrPaymentStatus(orderId?: string | null, enabled = true) {
  const lastSyncAt = useRef(0);

  useEffect(() => {
    lastSyncAt.current = 0;
  }, [orderId]);

  return useQuery({
    queryKey: ["qr-payment-status", orderId],
    queryFn: async () => {
      const order = await commerceService.orderDetail(orderId!);
      if (isQrPaymentConfirmed(order.status) || order.status !== "pending_payment") {
        return order;
      }
      if (Date.now() - lastSyncAt.current < 15_000) return order;
      lastSyncAt.current = Date.now();
      try {
        const verified = await commerceService.syncPaycloudPayment(orderId!);
        if (verified.status === "paid") {
          return commerceService.orderDetail(orderId!);
        }
      } catch {
        // Keep checking the order: the webhook may still confirm the payment.
      }
      return order;
    },
    enabled: enabled && Boolean(orderId),
    refetchInterval: (query) =>
      isQrPaymentConfirmed(query.state.data?.status) ? false : 3000,
    refetchIntervalInBackground: true,
    retry: false,
  });
}
