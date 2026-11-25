import { describe, expect, it } from "vitest";
import { getProfessionalDisplayName } from "./professionalDisplayName";

describe("Professional sharing name", () => {
  it.each([
    { Companies: [{ name: "Tienda de Bebidas" }] },
    { Companies: { name: "Tienda de Bebidas" } },
    { Company: [{ name: "Tienda de Bebidas" }] },
    { Company: { name: "Tienda de Bebidas" } },
    { companies: [{ name: "Tienda de Bebidas" }] },
    { companies: { name: "Tienda de Bebidas" } },
  ])("prioritizes the commercial name over the person's name for %j", (relation) => {
    expect(getProfessionalDisplayName({
      ...relation,
      Profile: { display_name: "Juan Pérez" },
    })).toBe("Tienda de Bebidas");
  });

  it("ignores empty relations and trims the commercial name", () => {
    expect(getProfessionalDisplayName({
      Companies: [],
      Company: { name: "   " },
      companies: [{ name: " Tienda de Bebidas " }],
      Profile: { display_name: "Juan Pérez" },
    })).toBe("Tienda de Bebidas");
  });

  it("uses the personal name only when there is no commercial name", () => {
    expect(getProfessionalDisplayName({ Profile: { display_name: " Juan Pérez " } }))
      .toBe("Juan Pérez");
    expect(getProfessionalDisplayName(undefined)).toBe("Profesional");
  });
});
