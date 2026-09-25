import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductDetailPage from "./ProductDetailPage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    seoPath: "producto-123",
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "id" ? "prod-123" : null),
  }),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isAgeVerified: false,
  }),
}));

vi.mock("../../context/AlertContext", () => ({
  useAlert: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("../../components/Navbar/Navbar", () => ({
  default: () => <nav data-testid="mock-navbar" />,
}));

vi.mock("../../components/Footer/Footer", () => ({
  default: () => <footer data-testid="mock-footer" />,
}));

vi.mock("../../components/CommentsCarousel/CommentsCarousel", () => ({
  default: () => <div data-testid="mock-comments" />,
}));

vi.mock("../../components/FavoriteButton/FavoriteButton", () => ({
  default: () => <button data-testid="mock-fav">Fav</button>,
}));

vi.mock("../../services/commerceService", () => ({
  commerceService: {
    variants: vi.fn().mockResolvedValue([]),
    addCartItem: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../app/actions/products", () => ({
  getProductDetailAction: vi.fn().mockResolvedValue({
    data: {
      id: "prod-123",
      name: "Taladro Inalámbrico",
      price: 25000,
      description: "Taladro potente",
      brand: "Bosch",
      ean: "7791234567890",
      free_shipping_country: true,
      ProfessionalProducts: [
        {
          id: 1,
          price: 25000,
          stock: 10,
          free_shipping_country: true,
          free_shipping_country_min_amount: 15000,
          offer_2x1: true,
          Professional: {
            id: 82,
            Company: { name: "Ferretería Central" },
          },
        },
      ],
    },
  }),
}));

describe("ProductDetailPage - Envío Gratis y Promociones", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  it("muestra el cartel de Envío Gratis a todo el País cuando free_shipping_country es true", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProductDetailPage />
      </QueryClientProvider>,
    );

    const banners = await screen.findAllByText(/Envío Gratis a todo el País/i);
    expect(banners.length).toBeGreaterThanOrEqual(1);
    expect(
      await screen.findByText(
        "Envíos Gratis a todo el País: Mínimo de compra $15.000",
      ),
    ).toBeInTheDocument();
  });

  it("muestra la etiqueta Oferta 2x1 en la sección de precios cuando offer_2x1 es true", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProductDetailPage />
      </QueryClientProvider>,
    );

    const offerBadge = await screen.findByText("Oferta 2x1");
    expect(offerBadge).toBeInTheDocument();
    expect(offerBadge.className).toContain("product-detail__quantity-offer");
  });

  it("muestra el botón de Contactar al comercio y oculta Comprar ahora cuando el precio es en USD", async () => {
    const { getProductDetailAction } =
      await import("../../app/actions/products");
    vi.mocked(getProductDetailAction).mockResolvedValueOnce({
      data: {
        id: "prod-usd",
        name: "Generador Solar",
        price: 1500,
        currency_code: "USD",
        ProfessionalProducts: [
          {
            id: 2,
            price: 1500,
            currency_code: "USD",
            stock: 5,
            Professional: {
              id: 90,
              Company: { name: "Energía Solar SAS" },
            },
          },
        ],
      },
    } as any);

    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <ProductDetailPage />
      </QueryClientProvider>,
    );

    const contactBtn = await screen.findByRole("button", {
      name: /Contactar al comercio/i,
    });
    expect(contactBtn).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Comprar ahora/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Agregar al carrito/i }),
    ).toBeNull();
  });
});
