import { describe, expect, it } from "vitest";
import { formatProfessionalSales } from "./ProfessionalReputation";

describe("formatProfessionalSales", () => {
  it.each([
    [0, "0 ventas"],
    [1, "1 venta"],
    [999, "999 ventas"],
    [1000, "1.000 ventas"],
    [1001, "Más de 1000 ventas"],
    [10000, "Más de 1000 ventas"],
    [10001, "Más de 10000 ventas"],
  ])("formats %i as %s", (count, label) => {
    expect(formatProfessionalSales(count)).toBe(label);
  });
});
