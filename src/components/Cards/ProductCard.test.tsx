import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProductCard from "./ProductCard";

describe("ProductCard", () => {
  it("muestra el precio y la oferta del producto normalizado", () => {
    render(<ProductCard product={{
      id: "p-1", title: "Campera", image: "/campera.jpg",
      price: 8000, originalPrice: 10000, offerPrice: 8000,
      wholesale: true, wholesale_price: 7000, wholesale_unit: 3,
      freeShipping: true,
    }} />);

    expect(screen.getByText("Campera")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Campera" })).toHaveAttribute("src", "/campera.jpg");
    expect(screen.getByText("$10.000")).toBeInTheDocument();
    expect(screen.getByText("$8.000")).toBeInTheDocument();
    expect(screen.getByText("20% OFF")).toBeInTheDocument();
    expect(screen.getByText("Por mayor: $7.000 c/u desde 3 un.")).toBeInTheDocument();
    expect(screen.getByText("Envío gratis")).toBeInTheDocument();
  });

  it("lee el precio y las promociones de la publicación profesional", () => {
    render(<ProductCard product={{
      id: "p-2", name: "Taladro", Images: [{ image_url: "/taladro.jpg", display_order: 0 }],
      ProfessionalProducts: [{ price: 15000, offer_price: 12000,
        offer_2x1: true, stock: 1, free_shipping: true }],
    }} />);

    expect(screen.getByText("$15.000")).toBeInTheDocument();
    expect(screen.getByText("$12.000")).toBeInTheDocument();
    expect(screen.getByText("OFERTA 2x1")).toBeInTheDocument();
    expect(screen.getByText("Última unidad")).toBeInTheDocument();
    expect(screen.getByText("Envío gratis")).toBeInTheDocument();
  });
});
