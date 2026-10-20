import { describe, expect, it } from "vitest";
import type { OrderSummary } from "@/services/commerceService";
import { getPurchaseDeliveryText, isServiceAtBranch } from "./purchaseDeliveryText";

const serviceOrder = (overrides: Partial<OrderSummary> = {}) => ({
  id: "order-1",
  status: "paid",
  delivery_type: "coordinate_with_merchant",
  total_amount: 1000,
  quantity: 1,
  created_at: "2026-10-18T12:00:00Z",
  service_id: "service-1",
  ...overrides,
}) as OrderSummary;

describe("service purchase delivery text", () => {
  it("keeps a home service at the buyer's home even when the order has the merchant's origin address", () => {
    const order = serviceOrder({
      origin_address_id: 5,
      service: { id: "service-1", name: "Instalación", service_location_ids: [] },
    });
    expect(isServiceAtBranch(order)).toBe(false);
    expect(getPurchaseDeliveryText(order)).toBe("El servicio se realiza en tu domicilio");
  });

  it("identifies a selected branch and the company's main branch", () => {
    const branch = serviceOrder({
      branch_id: "branch-1",
      branch: { id: "branch-1", name: "Centro" } as OrderSummary["branch"],
    });
    const main = serviceOrder({
      origin_address_id: 5,
      service: { id: "service-1", name: "Consulta", service_location_ids: ["main:82"] },
    });
    expect(getPurchaseDeliveryText(branch)).toBe("El servicio se realiza en la sucursal Centro");
    expect(getPurchaseDeliveryText(main)).toBe("El servicio se realiza en la sucursal principal");
  });

  it("uses the location saved with the purchase if the service configuration later changes", () => {
    const order = serviceOrder({
      service_location_kind: "home",
      origin_address_id: 5,
      service: { id: "service-1", name: "Instalación", service_location_ids: ["main:82"] },
    });
    expect(getPurchaseDeliveryText(order)).toBe("El servicio se realiza en tu domicilio");
  });

  it("shows when the service location must be agreed with the merchant", () => {
    const order = serviceOrder({ service_location_kind: "coordinate" });
    expect(getPurchaseDeliveryText(order)).toBe(
      "Lugar y horario a coordinar con el comercio",
    );
  });
});
