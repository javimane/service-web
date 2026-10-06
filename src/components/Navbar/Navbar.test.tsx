import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Navbar from "./Navbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

let mockUser: any = null;
let mockSessionStatus: any = null;
let mockHasProfessionalSubscription = false;

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
    hasProfessionalSubscription: mockHasProfessionalSubscription,
    subscriptionPlan: null,
    sessionStatus: mockSessionStatus,
  }),
}));

vi.mock("../../context/AuthModalContext", () => ({
  useAuthModal: () => ({
    openAuth: vi.fn(),
  }),
}));

vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    channel: () => ({
      on: () => ({
        on: () => ({
          subscribe: () => ({}),
        }),
      }),
    }),
    removeChannel: vi.fn(),
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 0, error: null }),
        }),
      }),
    }),
  },
}));

vi.mock("../../app/actions/notifications", () => ({
  getNotificationsAction: vi.fn().mockResolvedValue({ data: [] }),
  markAllNotificationsAsReadAction: vi.fn().mockResolvedValue({}),
  markNotificationAsReadAction: vi.fn().mockResolvedValue({}),
}));

describe("Navbar - Menú de usuario", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderNavbar = () =>
    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Navbar),
      ),
    );

  it("muestra el botón de Suscripción en el menú cuando el usuario es normal (cliente)", () => {
    mockUser = { id: "user-client-1", email: "cliente@test.com" };
    mockSessionStatus = { is_professional: false };
    mockHasProfessionalSubscription = false;

    renderNavbar();

    // Abrir menú de usuario
    const userBtn = screen.getByRole("button", { name: /menú de usuario/i });
    fireEvent.click(userBtn);

    const dropdown = document.querySelector(".navbar__dropdown") as HTMLElement;
    expect(dropdown).toBeInTheDocument();
    const dropdownScope = within(dropdown);

    // Debe mostrar la sección "Mi Cuenta"
    expect(dropdownScope.getByText("Mi Cuenta")).toBeInTheDocument();

    // Debe contener el botón de Suscripción
    expect(
      dropdownScope.getByRole("link", { name: /suscripción/i }),
    ).toBeInTheDocument();

    // Debe contener los otros enlaces de cliente
    expect(
      dropdownScope.getByRole("link", { name: /mensajes/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /presupuestos/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /solicitudes/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /preguntas frecuentes/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /configuración/i }),
    ).toBeInTheDocument();
  });

  it("muestra los menús del sidebar (Notificaciones, Reportar Error, Preguntas Frecuentes, Suscripción, etc.) cuando es profesional", () => {
    mockUser = { id: "user-prof-1", email: "profesional@test.com" };
    mockSessionStatus = { is_professional: true };
    mockHasProfessionalSubscription = true;

    renderNavbar();

    // Abrir menú de usuario
    const userBtn = screen.getByRole("button", { name: /menú de usuario/i });
    fireEvent.click(userBtn);

    const dropdown = document.querySelector(".navbar__dropdown") as HTMLElement;
    expect(dropdown).toBeInTheDocument();
    const dropdownScope = within(dropdown);

    // Debe mostrar la sección "Mi Panel"
    expect(dropdownScope.getByText("Mi Panel")).toBeInTheDocument();

    // Elementos traídos del sidebar que ahora están en el navbar
    expect(
      dropdownScope.getByRole("link", { name: /notificaciones/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /reportar error/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /preguntas frecuentes/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /suscripción/i }),
    ).toBeInTheDocument();
    expect(dropdownScope.getByRole("link", { name: /panel/i })).toBeInTheDocument();
    expect(dropdownScope.getByRole("link", { name: /perfil/i })).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /presupuestos/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /promociones/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /promos bancarias/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /productos/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /servicios/i }),
    ).toBeInTheDocument();
    expect(dropdownScope.getByRole("link", { name: /empleos/i })).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /publicaciones/i }),
    ).toBeInTheDocument();
    expect(dropdownScope.getByRole("link", { name: /agenda/i })).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /historias/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /referidos/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /mensajes/i }),
    ).toBeInTheDocument();
    expect(
      dropdownScope.getByRole("link", { name: /configuración/i }),
    ).toBeInTheDocument();
  });
});
