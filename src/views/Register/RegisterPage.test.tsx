import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import { supabase } from "../../services/supabaseClient";
import { authService } from "../../services/authService";
import { ROUTES } from "../../routes/paths";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));
vi.mock("./RegisterPlanSelection", () => ({ default: () => <div>Selección de planes</div> }));

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

  it("se renderiza correctamente con el checkbox de términos y condiciones", () => {
    renderWithRouter(React.createElement(RegisterPage));
    expect(screen.getByText("Crear Cuenta")).toBeInTheDocument();
    expect(screen.getByLabelText(/^NOMBRE$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^APELLIDO$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CONFIRMAR/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /términos y condiciones/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByLabelText("Busco Servicios/Productos")).toBeChecked();
    expect(screen.getByLabelText("Soy Profesional/Comercio")).not.toBeChecked();
    expect(screen.getByLabelText(/^CONTRASEÑA$/)).toHaveAccessibleDescription(/mínimo 9.*mayúscula.*número.*carácter especial/i);
  });

  it("muestra errores de validación si se envía vacío incluyendo los términos", () => {
    renderWithRouter(React.createElement(RegisterPage));
    const submitBtn = screen.getByRole("button", { name: /registrarse/i });

    fireEvent.click(submitBtn);

    expect(screen.getByText("Ingresá tu nombre")).toBeInTheDocument();
    expect(screen.getByText("Ingresá tu apellido")).toBeInTheDocument();
    expect(
      screen.getByText("El correo electrónico es requerido"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Debes aceptar los términos y condiciones para continuar",
      ),
    ).toBeInTheDocument();
  });

  it("marca los requisitos cumplidos al escribir y vuelve a dejarlos pendientes al borrar", () => {
    renderWithRouter(<RegisterPage />);
    const password = screen.getByLabelText(/^CONTRASEÑA$/);
    const requirements = screen.getByRole("list", { name: "Requisitos de la contraseña" });
    expect(requirements.querySelectorAll(".register-password__requirement--met")).toHaveLength(0);
    fireEvent.change(password, { target: { value: "Abc1!" } });
    expect(requirements.querySelectorAll(".register-password__requirement--met")).toHaveLength(4);
    expect(within(requirements).getByRole("listitem", { name: "Pendiente: Mínimo 9 caracteres" })).not.toHaveClass("register-password__requirement--met");
    fireEvent.change(password, { target: { value: "Abcdefg1!" } });
    expect(requirements.querySelectorAll(".register-password__requirement--met")).toHaveLength(5);
    fireEvent.change(password, { target: { value: "Abcdefg1" } });
    expect(within(requirements).getByRole("listitem", { name: /Pendiente: Al menos 1 carácter especial/ })).not.toHaveClass("register-password__requirement--met");
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

  it("bloquea el registro con Google si no se aceptaron los términos", () => {
    renderWithRouter(React.createElement(RegisterPage));
    const googleBtn = screen.getByRole("button", {
      name: /continuar con google/i,
    });

    fireEvent.click(googleBtn);

    expect(
      screen.getByText(
        "Debes aceptar los términos y condiciones antes de registrarte con Google",
      ),
    ).toBeInTheDocument();
  });

  it("permite abrir el modal de términos y condiciones y volver atrás al formulario", () => {
    renderWithRouter(React.createElement(RegisterPage));
    const termsLink = screen.getByRole("button", {
      name: /términos y condiciones/i,
    });

    fireEvent.click(termsLink);

    expect(
      screen.getByRole("heading", { name: "Términos y Condiciones" }),
    ).toBeInTheDocument();

    const backBtn = screen.getByRole("button", {
      name: /volver al registro/i,
    });
    fireEvent.click(backBtn);

    expect(
      screen.queryByRole("heading", { name: "Términos y Condiciones" }),
    ).not.toBeInTheDocument();
  });

  it("permite aceptar los términos desde el modal y volver al formulario", () => {
    renderWithRouter(React.createElement(RegisterPage));
    const termsLink = screen.getByRole("button", {
      name: /términos y condiciones/i,
    });

    fireEvent.click(termsLink);

    const acceptBtn = screen.getByRole("button", {
      name: /aceptar y volver/i,
    });
    fireEvent.click(acceptBtn);

    expect(
      screen.queryByRole("heading", { name: "Términos y Condiciones" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it.each(["Abcdef1!", "Abcdefg1!"])("exige más de 8 caracteres al registrar: %s", async (password) => {
    registerMock.mockClear();
    renderWithRouter(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText("Ej. Juan"), { target: { value: "Juan" } });
    fireEvent.change(screen.getByPlaceholderText("Ej. Pérez"), { target: { value: "Lopez" } });
    fireEvent.change(screen.getByPlaceholderText("arquitecto@obsidian.pro"), { target: { value: "juan@example.com" } });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], { target: { value: password } });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], { target: { value: password } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /^Registrarse$/i }));
    if (password.length === 8) {
      expect(screen.getByText("Debe tener al menos 9 caracteres")).toBeInTheDocument();
      expect(registerMock).not.toHaveBeenCalled();
    } else {
      await waitFor(() => expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({ password, role: "normal" })));
    }
  });

  it("llama a authService al enviar datos válidos con términos aceptados", async () => {
    registerMock.mockClear();
    registerMock.mockResolvedValueOnce({
      token: "mock-token",
    } as any);

    renderWithRouter(React.createElement(RegisterPage));
    const firstNameInput = screen.getByPlaceholderText("Ej. Juan");
    const lastNameInput = screen.getByPlaceholderText("Ej. Pérez");
    const emailInput = screen.getByPlaceholderText("arquitecto@obsidian.pro");
    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    const confirmInput = screen.getAllByPlaceholderText("••••••••")[1];
    const checkbox = screen.getByRole("checkbox");
    const submitBtn = screen.getByRole("button", { name: /registrarse/i });

    fireEvent.change(firstNameInput, { target: { value: "Juan" } });
    fireEvent.change(lastNameInput, { target: { value: "Lopez" } });
    fireEvent.change(emailInput, { target: { value: "juan@obsidian.pro" } });
    fireEvent.change(passwordInput, { target: { value: "Password1!" } });
    fireEvent.change(confirmInput, { target: { value: "Password1!" } });
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByLabelText("Soy Profesional/Comercio"));
    fireEvent.click(submitBtn);

    const requirements = screen.getByRole("dialog", { name: "Requisitos para una cuenta profesional" });
    expect(registerMock).not.toHaveBeenCalled();
    fireEvent.click(within(requirements).getByRole("checkbox"));
    fireEvent.click(within(requirements).getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        profileName: "Juan Lopez",
        firstName: "Juan",
        lastName: "Lopez",
        email: "juan@obsidian.pro",
        password: "Password1!",
        role: "professional",
        acceptedTerms: true,
      });
    });
    expect(await screen.findByRole("dialog", { name: "Registro exitoso" })).toHaveTextContent("Enviamos un email a juan@obsidian.pro");
  });

  it.each(["normal", "professional"])("muestra el aviso de email antes de continuar como %s aunque el inicio de sesión sea automático", async (role) => {
    router.push.mockClear();
    vi.mocked(authService.login).mockResolvedValueOnce({ user: { id: "new-user" } } as any);
    render(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText("Ej. Juan"), { target: { value: "Juan" } });
    fireEvent.change(screen.getByPlaceholderText("Ej. Pérez"), { target: { value: "Pérez" } });
    fireEvent.change(screen.getByPlaceholderText("arquitecto@obsidian.pro"), { target: { value: "juan@example.com" } });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], { target: { value: "Password1!" } });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], { target: { value: "Password1!" } });
    fireEvent.click(screen.getByRole("checkbox"));
    if (role === "professional") fireEvent.click(screen.getByLabelText("Soy Profesional/Comercio"));
    fireEvent.click(screen.getByRole("button", { name: /^Registrarse$/i }));
    if (role === "professional") {
      const requirements = screen.getByRole("dialog", { name: "Requisitos para una cuenta profesional" });
      fireEvent.click(within(requirements).getByRole("checkbox"));
      fireEvent.click(within(requirements).getByRole("button", { name: "Continuar" }));
    }
    const notice = await screen.findByRole("dialog", { name: "Registro exitoso" });
    expect(notice).toHaveTextContent("Enviamos un email a juan@example.com");
    expect(notice).toHaveTextContent("spam o correo no deseado");
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.queryByText("Selección de planes")).not.toBeInTheDocument();
    fireEvent.click(within(notice).getByRole("button", { name: "Cerrar" }));
    if (role === "professional") expect(screen.getByText("Selección de planes")).toBeInTheDocument();
    else expect(router.push).toHaveBeenCalledWith(ROUTES.accountSetup);
  });
});
