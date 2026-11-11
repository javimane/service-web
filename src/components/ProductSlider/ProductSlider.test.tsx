import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductSlider from "./ProductSlider";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock FavoriteButton
vi.mock("../FavoriteButton/FavoriteButton", () => ({
  default: () => <button data-testid="favorite-button">Fav</button>,
}));

describe("ProductSlider", () => {
  const sampleProducts = [
    {
      id: "prod-1",
      name: "Taladro Percutor 750W",
      price: 45000,
      image_url: "https://example.com/taladro.jpg",
    },
    {
      id: "prod-2",
      name: "Amoladora Angular",
      price: 32000,
      offer_price: 28000,
      image_url: "https://example.com/amoladora.jpg",
    },
  ];

  it("no renderiza nada si no hay productos y no está cargando", () => {
    const { container } = render(
      <ProductSlider title="Más Productos" products={[]} isLoading={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el estado de carga cuando isLoading es true", () => {
    render(
      <ProductSlider title="Más Productos" products={[]} isLoading={true} />,
    );
    expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
    expect(screen.getByText("Más Productos")).toBeInTheDocument();
  });

  it("renderiza el título, subtítulo, link y las tarjetas de productos", () => {
    render(
      <ProductSlider
        title="Más Productos del Vendedor"
        subtitle="Descubrí más artículos de Ferretería Central"
        products={sampleProducts}
        viewAllLink="/perfil/ferreteria/tienda"
        viewAllText="Ver tienda"
      />,
    );

    expect(screen.getByText("Más Productos del Vendedor")).toBeInTheDocument();
    expect(
      screen.getByText("Descubrí más artículos de Ferretería Central"),
    ).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByText("Ver tienda")).toBeInTheDocument();
    expect(screen.getByText("Taladro Percutor 750W")).toBeInTheDocument();
    expect(screen.getByText("Amoladora Angular")).toBeInTheDocument();
  });

  it("llama al callback onProductClick cuando se hace click en una tarjeta", () => {
    const handleClick = vi.fn();
    render(
      <ProductSlider
        title="Productos Similares"
        products={sampleProducts}
        onProductClick={handleClick}
      />,
    );

    const firstProductTitle = screen.getByText("Taladro Percutor 750W");
    fireEvent.click(firstProductTitle);
    expect(handleClick).toHaveBeenCalledWith(sampleProducts[0]);
  });
});
