import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RegisterPage from "./RegisterPage";
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
  }),
}));

vi.mock("../../services/authService", () => ({
  authService: {
    register: vi.fn().mockResolvedValue({ token: "token-123" }),
    login: vi.fn().mockRejectedValue(new Error("skip auto login")),
  },
}));

// Mock Supabase client
vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

const registerMock = vi.mocked(authService.register);

describe("RegisterPage", () => {
  const renderWithRouter = (ui) => {
    return render(ui);
  };

  it("se renderiza correctamente", () => {
    renderWithRouter(React.createElement(RegisterPage));
    expect(screen.getByText("Crear Cuenta")).toBeInTheDocument();
    expect(screen.getByLabelText(/NOMBRE COMPLETO/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CONFIRMAR/i)).toBeInTheDocument();
  });

  it("muestra errores de validación si se envía vacío", () => {
    renderWithRouter(React.createElement(RegisterPage));
    const submitBtn = screen.getByRole("button", { name: /registrarse/i });

    fireEvent.click(submitBtn);

    expect(screen.getByText("El nombre es requerido")).toBeInTheDocument();
    expect(
      screen.getByText("El correo electrónico es requerido"),
    ).toBeInTheDocument();
  });

  it("valida que las contraseñas coincidan", () => {
    renderWithRouter(React.createElement(RegisterPage));
    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    const confirmInput = screen.getAllByPlaceholderText("••••••••")[1];
    const submitBtn = screen.getByRole("button", { name: /registrarse/i });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "passwordXXX" } });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText("Las contraseñas no coinciden"),
    ).toBeInTheDocument();
  });

  it("llama a authService al enviar datos válidos", async () => {
    registerMock.mockResolvedValueOnce({
      token: "mock-token",
    } as any);

    renderWithRouter(React.createElement(RegisterPage));
    const nameInput = screen.getByPlaceholderText("Ej. Juan Pérez");
    const emailInput = screen.getByPlaceholderText("arquitecto@obsidian.pro");
    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    const confirmInput = screen.getAllByPlaceholderText("••••••••")[1];
    const submitBtn = screen.getByRole("button", { name: /registrarse/i });

    fireEvent.change(nameInput, { target: { value: "Juan Lopez" } });
    fireEvent.change(emailInput, { target: { value: "juan@obsidian.pro" } });
    fireEvent.change(passwordInput, { target: { value: "Password1!" } });
    fireEvent.change(confirmInput, { target: { value: "Password1!" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        profileName: "Juan Lopez",
        email: "juan@obsidian.pro",
        password: "Password1!",
        role: "professional",
      });
      expect(
        screen.getByText("Registro exitoso"),
      ).toBeInTheDocument();
    });
  });
});
