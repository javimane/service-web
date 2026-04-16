import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import { supabase } from "../../services/supabaseClient";

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
  const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

  it("se renderiza correctamente", () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText("Bienvenido")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("arquitecto@obsidian.pro"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("muestra errores de validación si se envía vacío", () => {
    renderWithRouter(<LoginPage />);
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    fireEvent.click(submitBtn);

    expect(
      screen.getByText("El correo electrónico es requerido"),
    ).toBeInTheDocument();
    expect(screen.getByText("La contraseña es requerida")).toBeInTheDocument();
  });

  it("muestra error de formato de email", () => {
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByPlaceholderText("arquitecto@obsidian.pro");
    const submitBtn = screen.getByRole("button", { name: /ingresar/i });

    fireEvent.change(emailInput, { target: { value: "emailinvalido" } });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText("El formato del correo es inválido"),
    ).toBeInTheDocument();
  });

  it("llama a Supabase al enviar datos válidos", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    // Configurar respuesta del mock
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: { id: "1" } },
      error: null,
    } as any);

    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByPlaceholderText("arquitecto@obsidian.pro");
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
});
