import type { OrderSummary } from "@/services/commerceService";

export function isServiceOrderSummary(order?: Partial<OrderSummary> | null): boolean {
  if (!order) return false;
  const appointment = order.appointment;
  return Boolean(
    order.service_id || order.service || order.appointment_status ||
    (Array.isArray(appointment) ? appointment.length > 0 : appointment) ||
    order.items?.some((item) => item.service_id || item.service || item.item_type === "service"),
  );
}
