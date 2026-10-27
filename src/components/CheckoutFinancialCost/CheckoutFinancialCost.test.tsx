import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CheckoutFinancialCost from "./CheckoutFinancialCost";

describe("checkout financing disclosure", () => {
  it("shows the zero cost and annual rate even for a single card payment", () => {
    render(<CheckoutFinancialCost totalAmount={10000} financingAmount={0} installments={1} paymentMethod="card" />);
    expect(screen.getByText("CFTEA: 0,00%")).toBeInTheDocument();
    expect(screen.getByText("TEA: 0,00%")).toBeInTheDocument();
    expect(screen.getByText("Mismo precio · sin recargo")).toBeInTheDocument();
  });

  it("shows the actual surcharge and monthly plan without inventing a provider TEA", () => {
    render(<CheckoutFinancialCost totalAmount={11500} financingAmount={1500} installments={3} paymentMethod="card" />);
    expect(screen.getByText(/3 cuotas de/)).toHaveTextContent("3.833,33");
    expect(screen.getByText("Recargo total: 15,00%")).toBeInTheDocument();
    expect(screen.getByText(/CFTEA estimado:/)).not.toHaveTextContent("0,00%");
    expect(screen.getByText("TEA: No informada por el financiador")).toBeInTheDocument();
  });

  it("discloses a QR as one payment even after selecting card installments", () => {
    render(<CheckoutFinancialCost totalAmount={10000} financingAmount={1500} installments={3} paymentMethod="paycloud_qr" />);
    expect(screen.getByText(/1 pago de/)).toBeInTheDocument();
    expect(screen.queryByText(/3 cuotas/)).not.toBeInTheDocument();
    expect(screen.getByText("CFTEA: 0,00%")).toBeInTheDocument();
  });

  it("does not label an unconfirmed financing quote as free", () => {
    render(<CheckoutFinancialCost totalAmount={10000} financingAmount={null} installments={3} paymentMethod="card" pending />);
    expect(screen.getByText("Pendiente de cálculo")).toBeInTheDocument();
    expect(screen.queryByText("CFTEA: 0,00%")).not.toBeInTheDocument();
  });
});
