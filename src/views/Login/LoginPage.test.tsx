import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "./LoginPage";
import { supabase } from "../../services/supabaseClient";
import { authService } from "../../services/authService";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    sessionStatus: null,
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
      signInWithPassword: vi.fn(),
    },
  },
}));

const signInWithPasswordMock = vi.mocked(supabase.auth.signInWithPassword);

describe("LoginPage", () => {
  const renderWithRouter = (ui) => render(ui);

  it("se renderiza correctamente", () => {
    renderWithRouter(React.createElement(LoginPage));
    expect(screen.getByText("Bienvenido")).toBeInTheDocument();
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
});
