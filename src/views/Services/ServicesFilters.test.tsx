import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ServicesFilters from "./ServicesFilters";
import { filterServices, priceRangeOptions } from "./serviceUtils";

describe("filtro de precios de servicios", () => {
  it("actualiza priceRange, la clave que usa la búsqueda", () => {
    const onFilterChange = vi.fn();
    render(<ServicesFilters
      filters={{ priceRange: "all" }}
      categories={[]}
      provinces={[]}
      onFilterChange={onFilterChange}
      onReset={vi.fn()}
    />);

    const priceSelect = screen.getAllByRole("combobox").at(-1)!;
    fireEvent.change(priceSelect, { target: { value: "150000-250000" } });
    expect(onFilterChange).toHaveBeenCalledWith({ priceRange: "150000-250000" });
  });

  it("cubre los límites sin solapamientos ni servicios sin precio", () => {
    const services = [0, 50000, 50000.01, 150000, 150000.01, 250000, 250000.01]
      .map((base_price) => ({ base_price }));
    const pricesFor = (priceRange: string) => filterServices(services, {
      search: "", category: "All", province: "All", city: "All", priceRange,
    }).map((service) => service.base_price);

    expect(priceRangeOptions).toHaveLength(5);
    expect(pricesFor("0-50000")).toEqual([50000]);
    expect(pricesFor("50000-150000")).toEqual([50000.01, 150000]);
    expect(pricesFor("150000-250000")).toEqual([150000.01, 250000]);
    expect(pricesFor("250000-plus")).toEqual([250000.01]);
  });
});
