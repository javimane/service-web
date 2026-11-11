import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import OrderItemPricing from "./OrderItemPricing";
import type { OrderPricingSnapshot } from "@/services/commerceService";

const snapshot: OrderPricingSnapshot = {
  version: 1, original_unit_price: 100, applied_unit_price: 80, price_type: "offer",
  unit_discount_amount: 20, unit_discount_percent: 20, promotion: "2x1",
  paid_units: 2, free_units: 1, total_discount_amount: 140,
};

describe("detalle histórico del precio", () => {
  it("muestra la oferta y la promoción que explican el subtotal", () => {
    render(<OrderItemPricing pricing={snapshot} unitPrice={80} />);
    expect(screen.getByText(/Precio original:.*100/)).toBeInTheDocument();
    expect(screen.getByText(/Precio de oferta:.*80.*Descuento:.*20/)).toBeInTheDocument();
    expect(screen.getByText(/Promoción 2x1.*Pagás 2 unidades.*1 bonificadas/)).toBeInTheDocument();
    expect(screen.getByText(/Ahorro total.*140/)).toBeInTheDocument();
  });
  it("muestra el precio por mayor junto a 3x2 sin atribuirlo a una oferta", () => {
    render(<OrderItemPricing pricing={{ ...snapshot, price_type: "wholesale", promotion: "3x2" }} unitPrice={80} />);
    expect(screen.getByText(/Precio por mayor:.*80/)).toBeInTheDocument();
    expect(screen.getByText(/Promoción 3x2/)).toBeInTheDocument();
    expect(screen.queryByText(/Precio de oferta/)).not.toBeInTheDocument();
  });
  it("no inventa el precio original ni una promoción para ventas antiguas", () => {
    render(<OrderItemPricing unitPrice={75} />);
    expect(screen.getByText(/Precio unitario:.*75/)).toBeInTheDocument();
    expect(screen.queryByText(/Precio original|Promoción|Descuento/)).not.toBeInTheDocument();
  });
});
