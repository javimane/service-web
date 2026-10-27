import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductBranchStock from "./ProductBranchStock";

const api = vi.hoisted(() => ({ productStockLocations: vi.fn(), saveProductBranchStock: vi.fn() }));
vi.mock("@/services/commerceService", () => ({ commerceService: api }));

describe("Branch inventory editor", () => {
  it("assigns a second branch without copying stock from the main location", async () => {
    api.productStockLocations.mockResolvedValue([
      { id: "main:1", is_main: true, address_id: 10, name: "Principal", stock: 10, assigned: true },
      { id: "branch-2", name: "Norte", stock: 0, assigned: false },
    ]);
    api.saveProductBranchStock.mockResolvedValue([]);
    const onSaved = vi.fn();
    render(<ProductBranchStock listingId="listing" onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: "Stock por sucursal" }));
    expect(screen.getByRole("dialog", { name: "Stock por sucursal" }).parentElement?.parentElement).toBe(document.body);
    const stock = await screen.findByRole("spinbutton", { name: "Stock en Norte" });
    expect(stock).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Norte" }));
    fireEvent.change(stock, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar stock" }));
    await waitFor(() => expect(api.saveProductBranchStock).toHaveBeenCalledWith("listing", [
      { origin_address_id: 10, stock: 10 }, { branch_id: "branch-2", stock: 1 },
    ]));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
