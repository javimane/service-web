import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductDetailPage from "./ProductDetailPage";
import { getProductDetailAction } from "../../app/actions/products";
import { commerceService } from "../../services/commerceService";

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

const { mockShowError, mockShowSuccess, mockUseAuth } = vi.hoisted(() => ({
  mockShowError: vi.fn(),
  mockShowSuccess: vi.fn(),
  mockUseAuth: vi.fn().mockReturnValue({
    user: null,
    isAgeVerified: false,
  }),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../context/AlertContext", () => ({
  useAlert: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
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
      ProfessionalProducts: [
        {
          id: 1,
          price: 25000,
          stock: 10,
          free_shipping: false,
          offer_2x1: true,
          Professional: {
            id: 82,
            Company: { name: "Ferretería Central", free_shipping_country: true, free_shipping_country_min_amount: 15000 },
          },
        },
      ],
    },
  }),
}));

describe("ProductDetailPage - Envío Gratis y Promociones", () => {
  const createQueryClient = () => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  it("muestra el mínimo de la empresa debajo del precio", async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <ProductDetailPage />
      </QueryClientProvider>,
    );

    const note = await screen.findByText("Envío gratis a todo el país desde $15.000");
    expect(note.closest(".seller-card__shipping-note")).toBeInTheDocument();
  });

  it("prioriza el envío gratis individual sobre el mínimo de la empresa", async () => {
    vi.mocked(getProductDetailAction).mockResolvedValueOnce({
      data: {
        id: "prod-123",
        name: "Taladro Inalámbrico",
        price: 25000,
        ProfessionalProducts: [{
          id: 1,
          price: 25000,
          stock: 10,
          free_shipping: true,
          Professional: {
            id: 82,
            Company: { name: "Ferretería Central", free_shipping_country: true, free_shipping_country_min_amount: 15000 },
          },
        }],
      },
    } as any);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProductDetailPage />
      </QueryClientProvider>,
    );

    const note = await screen.findByText("Envío gratis a todo el país");
    expect(note.closest(".seller-card__shipping-note")).toBeInTheDocument();
    expect(screen.queryByText(/desde \$15\.000/)).not.toBeInTheDocument();
  });

  it("no anuncia envío gratis cuando está desactivado en el producto y la empresa", async () => {
    vi.mocked(getProductDetailAction).mockResolvedValueOnce({
      data: {
        id: "prod-123",
        name: "Taladro Inalámbrico",
        price: 25000,
        ProfessionalProducts: [{
          id: 1,
          price: 25000,
          stock: 10,
          free_shipping: false,
          Professional: {
            id: 82,
            Company: {
              name: "Ferretería Central",
              free_shipping: false,
              free_shipping_country: false,
              free_shipping_country_min_amount: 15000,
            },
          },
        }],
      },
    } as any);
    const { container } = render(
      <QueryClientProvider client={createQueryClient()}>
        <ProductDetailPage />
      </QueryClientProvider>,
    );

    await screen.findByText("Taladro Inalámbrico");
    expect(container.querySelector(".seller-card__shipping-note")).not.toBeInTheDocument();
  });

  it("muestra la etiqueta Oferta 2x1 en la sección de precios cuando offer_2x1 es true", async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
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

  it("muestra el mensaje de error del backend cuando ya hay productos de otro profesional en el carrito", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-test-123", email: "test@example.com" },
      isAgeVerified: false,
    });

    const expectedErrorMessage =
      "Solo podes agregar productos del mismo comercio al carrito. Vacia el carrito primero para agregar productos de otro comercio.";

    const errorWithResponse: any = new Error(expectedErrorMessage);
    errorWithResponse.response = {
      data: {
        message: expectedErrorMessage,
        path: "/api/users/me/cart/items",
        statusCode: 400,
        timestamp: "2026-09-28T23:46:17.976Z",
      },
      status: 400,
    };

    vi.mocked(commerceService.addCartItem).mockRejectedValueOnce(errorWithResponse);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ProductDetailPage />
      </QueryClientProvider>,
    );

    const addToCartButton = await screen.findByRole("button", {
      name: /Agregar al carrito/i,
    });
    expect(addToCartButton).toBeInTheDocument();

    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(expectedErrorMessage);
    });
  });
});

