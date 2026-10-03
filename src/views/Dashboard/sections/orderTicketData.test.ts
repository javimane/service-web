import { describe, expect, it } from "vitest";
import type { OrderSummary } from "@/services/commerceService";
import { getBuyerName, getDeliveryAddress, getOrderLines, getProductImage, getSaleLocation, isPrintableOrder } from "./orderTicketData";

const baseOrder = {
  id: "abc12345",
  status: "confirmed",
  delivery_type: "shipment",
  created_at: "2026-09-28T12:00:00Z",
  total_amount: 2000,
  quantity: 1,
} as OrderSummary;

describe("datos para tickets de venta", () => {
  it("omite las ventas sin pago y canceladas", () => {
    expect(isPrintableOrder(baseOrder)).toBe(true);
    for (const status of ["pending_payment", "cancelled", "refunded"] as const) {
      expect(isPrintableOrder({ ...baseOrder, status })).toBe(false);
    }
  });

  it("usa el comprador, dirección y producto reales", () => {
    const order: OrderSummary = {
      ...baseOrder,
      buyer: { first_name: "Ana", last_name: "Pérez" },
      delivery_address: { id: "a1", street: "Belgrano", number: "123", city: "Córdoba" },
      items: [{ id: "i1", quantity: 2, unit_price: 1000, subtotal: 2000, product: { id: "p1", name: "Remera", ean: "7791234567890", attributes: [{ name: "Talle", value: "M" }] } }],
    };
    expect(getBuyerName(order)).toBe("Ana Pérez");
    expect(getDeliveryAddress(order)).toContain("Belgrano 123");
    expect(getOrderLines(order)[0]).toMatchObject({ name: "Remera", ean: "7791234567890", attributes: "Talle: M" });
  });

  it("reemplaza el perfil anónimo con el nombre de facturación", () => {
    expect(getBuyerName({ ...baseOrder, buyer: { display_name: "anonymous" }, billing_data: { full_name: "María López" } })).toBe("María López");
  });

  it("elige la primera imagen por su orden de presentación", () => {
    expect(getProductImage({ id: "p1", name: "Remera", products_images: [
      { image_url: "segunda.jpg", display_order: 2 },
      { image_url: "primera.jpg", display_order: 1 },
    ] })).toBe("primera.jpg");
  });

  it("muestra la sucursal de venta y las características del producto", () => {
    const order: OrderSummary = {
      ...baseOrder,
      branch: {
        id: "sucursal-1", company_id: 5, name: "Centro", is_pickup_point: true,
        street_name: "San Martín", street_number: "120", zip_code: "5000", phone: "3511234567",
      },
      items: [{ id: "i2", quantity: 1, unit_price: 2000, subtotal: 2000,
        product: { id: "p2", name: "Campera", color: "Azul", size_letter: "L" } }],
    };
    expect(getSaleLocation(order)).toEqual({
      name: "Centro", address: "San Martín 120, CP 5000", phone: "3511234567",
    });
    expect(getOrderLines(order)[0].attributes).toBe("Color: Azul · Talle: L");
  });

  it("usa la dirección principal cuando la venta no tiene branch_id", () => {
    expect(getSaleLocation({ ...baseOrder,
      origin_address: { id: 9, street_name: "Belgrano", street_number: "18" },
    })).toMatchObject({ name: "Sucursal Principal", address: "Belgrano 18" });
  });
});
