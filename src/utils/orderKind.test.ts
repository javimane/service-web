import { describe, expect, it } from "vitest";
import { isServiceOrderSummary } from "./orderKind";

describe("isServiceOrderSummary", () => {
  it("detecta servicios aunque no venga service_id", () => {
    expect(isServiceOrderSummary({ service: { id: "svc", name: "Turno" } })).toBe(true);
    expect(isServiceOrderSummary({ items: [{ id: "item", service: { id: "svc", name: "Turno" }, quantity: 1, unit_price: 1, subtotal: 1 }] })).toBe(true);
    expect(isServiceOrderSummary({ appointment_status: "pending_appointment" })).toBe(true);
  });

  it("no clasifica un producto como servicio por una relación de turnos vacía", () => {
    expect(isServiceOrderSummary({ appointment: [] } as any)).toBe(false);
  });
});
