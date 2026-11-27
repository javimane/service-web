import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import LoginPage from "./LoginPage";
import { supabase } from "../../services/supabaseClient";
import { authService } from "../../services/authService";

const loginNavigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));
const oauthSession = vi.hoisted(() => ({
  user: null as { id: string } | null,
  status: null as { is_professional: boolean; requires_personal_name: boolean } | null,
}));
vi.mock("../Register/RegisterPlanSelection", () => ({
  default: () => <div>Elegí tu plan profesional</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    ...loginNavigation,
  }),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: oauthSession.user,
    sessionStatus: oauthSession.status,
    hasProfessionalSubscription: false,
    subscriptionPlan: null,
    refreshUser: vi.fn(),
    refreshSession: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    setSessionStatus: vi.fn(),
  }),
  normalizeSessionPayload: (payload: any) => ({
    nextUser: payload?.data?.user ?? payload?.user ?? null,
    nextSessionStatus: payload?.sessionStatus ?? null,
  }),
}));

vi.mock("../../services/authService", () => ({
  authService: {
    login: vi.fn().mockResolvedValue({
      token: "mock-token",
      sessionStatus: { is_professional: false },
    }),
    logout: vi.fn().mockResolvedValue({}),
    resetPassword: vi.fn().mockResolvedValue({}),
  },
}));

// Mock Supabase client
vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "1" } }, error: null }),
    },
  },
}));

const signInWithPasswordMock = vi.mocked(supabase.auth.signInWithPassword);

describe("LoginPage", () => {
  beforeEach(() => {
    oauthSession.user = null;
    oauthSession.status = null;
    localStorage.clear();
    loginNavigation.push.mockClear();
    loginNavigation.replace.mockClear();
    window.history.replaceState({}, "", "/login");
  });
  const renderWithRouter = (ui) => render(ui);

  it.each([false, true])("continúa el registro de Google con is_professional=%s", async (isProfessional) => {
    window.history.replaceState({}, "", "/login?google_signup=1");
    oauthSession.user = { id: "google-user" };
    oauthSession.status = { is_professional: isProfessional, requires_personal_name: true };

    render(<LoginPage />);

    if (isProfessional) {
      expect(await screen.findByText("Elegí tu plan profesional")).toBeInTheDocument();
      expect(loginNavigation.push).not.toHaveBeenCalled();
    } else {
      await waitFor(() => expect(loginNavigation.replace).toHaveBeenCalledWith("/completar-perfil"));
    }
    expect(localStorage.getItem("show_setup_on_login")).toBe("true");
  });

  it("se renderiza correctamente", () => {
    renderWithRouter(React.createElement(LoginPage));
    expect(screen.getByText("Bienvenido")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Volver al inicio" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByPlaceholderText("tu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("muestra errores de validación si se envía vacío", () => {
    renderWithRouter(React.createElement(LoginPage));
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    fireEvent.click(submitBtn);

    expect(screen.getByText("Ingresá tu email")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es requerida")).toBeInTheDocument();
  });

  it("muestra error de formato de email", () => {
    renderWithRouter(React.createElement(LoginPage));
    const emailInput = screen.getByPlaceholderText("tu@email.com");
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    fireEvent.change(emailInput, { target: { value: "1emailinvalido" } });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Ingresá un email válido")).toBeInTheDocument();
  });

  it("llama a Supabase al enviar datos válidos", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: { id: "1" } },
      error: null,
    } as any);

    renderWithRouter(React.createElement(LoginPage));
    const emailInput = screen.getByPlaceholderText("tu@email.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    fireEvent.change(emailInput, { target: { value: "test@obsidian.pro" } });
    fireEvent.change(passwordInput, { target: { value: "1234567" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "test@obsidian.pro",
        password: "1234567",
      });
    });
  });

  it("bloquea el inicio de sesión si la cuenta pertenece a un repartidor", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      data: {
        user: {
          id: "rider-1",
          user_metadata: { role: "delivery" },
        },
      },
      sessionStatus: { logistics_role: "delivery" },
    } as any);

    renderWithRouter(React.createElement(LoginPage));
    const emailInput = screen.getByPlaceholderText("tu@email.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    fireEvent.change(emailInput, { target: { value: "rider@empresa.com" } });
    fireEvent.change(passwordInput, { target: { value: "1234567" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Los repartidores no tienen acceso a la plataforma web. Por favor, utilizá la aplicación móvil.",
        ),
      ).toBeInTheDocument();
    });

    expect(authService.logout).toHaveBeenCalled();
  });

  it.each([false, true])(
    "returns to the purchase after login (professional: %s)",
    async (professional) => {
      const destination =
        "/pagar/producto/042fcecf-8fda-42ce-8ff9-04d729c6f843?quantity=3";
      window.history.replaceState(
        {},
        "",
        `/login?redirect=${encodeURIComponent(destination)}`,
      );
      vi.mocked(authService.login).mockResolvedValueOnce({
        data: { user: { id: "buyer-1", email: "buyer@example.com" } },
        sessionStatus: { is_professional: professional },
      } as any);
      signInWithPasswordMock.mockResolvedValueOnce({
        data: {},
        error: null,
      } as any);
      render(<LoginPage />);
      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
        target: { value: "buyer@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "Password1!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^ingresar$/i }));
      await waitFor(() =>
        expect(loginNavigation.replace).toHaveBeenCalledWith(destination),
      );
      expect(loginNavigation.push).not.toHaveBeenCalled();
    },
  );
});
