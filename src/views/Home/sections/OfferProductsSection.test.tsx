import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import OfferProductsSection from "./OfferProductsSection";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/app/actions/products", () => ({
  getProductsAction: vi.fn().mockResolvedValue({
    data: [{ id: "product-1", name: "Taladro", price: 100, offer_price: 80, seo_path: "/taladro" }],
  }),
}));

vi.mock("../../../components/FavoriteButton/FavoriteButton", () => ({
  default: () => <button type="button" aria-label="Agregar a favoritos">Favorito</button>,
}));

vi.mock("../../../hooks/useCarouselDrag", () => ({
  default: () => ({
    showLeftArrow: false,
    showRightArrow: false,
    scrollCarousel: vi.fn(),
    handlePointerDown: vi.fn(),
    handlePointerMove: vi.fn(),
    handlePointerUp: vi.fn(),
    updateArrowVisibility: vi.fn(),
  }),
}));

describe("OfferProductsSection", () => {
  it("mantiene separados el botón de abrir producto y el de favoritos", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OfferProductsSection />
      </QueryClientProvider>,
    );

    const openButton = await screen.findByRole("button", { name: "Ver Taladro" });
    const favoriteButton = screen.getByRole("button", { name: "Agregar a favoritos" });
    const card = openButton.closest(".offer-product-card");

    expect(card).toContainElement(favoriteButton);
    expect(openButton).not.toContainElement(favoriteButton);
    fireEvent.click(favoriteButton);
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(openButton);
    expect(push).toHaveBeenCalledWith("/productos/taladro");
  });
});
