import type { OrderSummary } from "@/services/commerceService";

export function isServiceAppointmentScheduled(order: Partial<OrderSummary>): boolean {
  return order.appointment_status === "scheduled" && order.appointment?.status === "scheduled";
}
