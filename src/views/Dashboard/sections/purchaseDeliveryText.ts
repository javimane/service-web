import type { OrderSummary } from "@/services/commerceService";
import { isServiceOrderSummary } from "@/utils/orderKind";

export function isServiceAtBranch(order: OrderSummary): boolean {
  if (!isServiceOrderSummary(order)) return false;
  if (order.service_location_kind) return order.service_location_kind === "branch";
  return Boolean(order.branch_id || order.service?.service_location_ids?.length);
}

export function getPurchaseDeliveryText(order: OrderSummary): string {
  if (isServiceOrderSummary(order)) {
    if (order.service_location_kind === "coordinate") {
      return "Lugar y horario a coordinar con el comercio";
    }
    if (!isServiceAtBranch(order)) return "El servicio se realiza en tu domicilio";
    return order.branch?.name
      ? `El servicio se realiza en la sucursal ${order.branch.name}`
      : "El servicio se realiza en la sucursal principal";
  }

  switch (order.delivery_type) {
    case "pickup":
      return "Retiro en sucursal";
    case "shipment":
      return "Envío a domicilio";
    case "coordinate_with_merchant":
      return "Acordar con vendedor";
    default:
      return order.delivery_type;
  }
}
