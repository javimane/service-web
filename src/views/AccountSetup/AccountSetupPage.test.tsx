import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountSetupPage from "./AccountSetupPage";
import { getProfileAction, updateProfileAction } from "@/app/actions/profile";
import { commerceService } from "@/services/commerceService";
import { getProfessionalDetailAction, getProfessionalMeAction } from "@/app/actions/professionals";

const { router, auth } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  auth: {
    user: { id: "user-1" },
    sessionStatus: { is_professional: false, professional_id: null } as any,
    loading: false,
    isAgeVerified: false,
    refreshSession: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/Navbar/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/views/Settings/sections/DeliveryAddressSection", () => ({
  default: () => <div>Formulario de direcciones</div>,
}));
vi.mock("@/views/Settings/sections/BillingDataSection", () => ({
  default: () => <div>Formulario de facturación</div>,
}));
vi.mock("@/views/Dashboard/sections/CommercialDataSection", () => ({
  default: ({ onSaved }: { onSaved?: () => void }) => <div>Formulario comercial<button onClick={onSaved}>Simular guardado comercial exitoso</button></div>,
}));
vi.mock("@/views/Dashboard/sections/ProfessionalProfileSection", () => ({
  default: () => <div>Formulario del perfil público</div>,
}));
vi.mock("@/app/actions/profile", () => ({
  getProfileAction: vi.fn(),
  updateProfileAction: vi.fn(),
}));
vi.mock("@/app/actions/professionals", () => ({
  getProfessionalMeAction: vi.fn(),
  getProfessionalDetailAction: vi.fn(),
}));
vi.mock("@/services/commerceService", () => ({
  commerceService: { getUserAddresses: vi.fn() },
}));
vi.mock("@/utils/auth", () => ({ getAccessToken: () => "token" }));

describe("AccountSetupPage", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollTo", vi.fn());
    localStorage.clear();
    vi.clearAllMocks();
    auth.sessionStatus = { is_professional: false, professional_id: null };
    auth.refreshSession.mockResolvedValue({ arca_verified: true, cbu_verified: true });
    vi.mocked(getProfileAction).mockResolvedValue({
      data: { first_name: "Ana", last_name: "Pérez", phone: "1123456789" },
    } as any);
    vi.mocked(updateProfileAction).mockResolvedValue({ data: {} } as any);
  });

  it("exige guardar una dirección antes de avanzar al paso de facturación", async () => {
    vi.mocked(commerceService.getUserAddresses)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "address-1" }] as any);
    render(<AccountSetupPage />);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    expect(await screen.findByText("Formulario de direcciones")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Guardá una dirección");
    expect(screen.queryByText("Formulario de facturación")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    expect(await screen.findByText("Formulario de facturación")).toBeInTheDocument();
    await waitFor(() => expect(updateProfileAction).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ first_name: "Ana", last_name: "Pérez" }) }),
    ));
  });

  it("informa en el último paso que el comprador debe verificarse en la app antes de pagar", async () => {
    vi.mocked(commerceService.getUserAddresses).mockResolvedValue([{ id: "address-1" }] as any);
    render(<AccountSetupPage />);

    await screen.findByText("Ana Pérez");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    await screen.findByText("Formulario de direcciones");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    await screen.findByText("Formulario de facturación");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));

    expect(await screen.findByRole("heading", { name: "Antes de comprar, verificá tu cuenta" })).toBeInTheDocument();
    expect(screen.getByText(/titular de la tarjeta que uses para pagar/i)).toBeInTheDocument();
  });

  it("lleva al profesional hasta la indicación de verificar DNI y rostro en la app", async () => {
    auth.sessionStatus = { is_professional: true, professional_id: 82 };
    vi.mocked(commerceService.getUserAddresses).mockResolvedValue([{ id: "address-1" }] as any);
    vi.mocked(getProfessionalMeAction).mockResolvedValue({ data: { companies: { name: "Mi negocio", tax_code: "20123456789" } } } as any);
    vi.mocked(getProfessionalDetailAction).mockResolvedValue({ data: { bio: "Reparaciones y mantenimiento" } } as any);
    render(<AccountSetupPage />);

    await screen.findByText("Ana Pérez");
    expect(screen.queryByRole("textbox", { name: "Nombre" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Apellido" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    await screen.findByText("Formulario de direcciones");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    await screen.findByText("Formulario comercial");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    await screen.findByText("Formulario del perfil público");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));

    expect(await screen.findByText(/foto de tu DNI y una foto de tu rostro/i)).toBeInTheDocument();
  });

  it("permite completar el nombre y apellido si no se guardaron en el registro", async () => {
    vi.mocked(getProfileAction).mockResolvedValue({ data: { phone: "1123456789" } } as any);
    render(<AccountSetupPage />);
    expect(await screen.findByRole("textbox", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Apellido" })).toBeInTheDocument();
  });

  it("quita el aviso de datos comerciales faltantes después de guardarlos correctamente", async () => {
    auth.sessionStatus = { is_professional: true, professional_id: 82 };
    localStorage.setItem("account_setup_step_user-1", "commercial");
    vi.mocked(getProfessionalMeAction).mockResolvedValue({ data: { companies: null } } as any);
    render(<AccountSetupPage />);
    await screen.findByText("Formulario comercial");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Guardá el nombre comercial");
    fireEvent.click(screen.getByRole("button", { name: "Simular guardado comercial exitoso" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Formulario comercial")).toBeInTheDocument();
  });

  it.each([
    [{ arca_verified: false, cbu_verified: true }, "los datos fiscales en ARCA"],
    [{ arca_verified: true, cbu_verified: false }, "el CBU de cobro"],
    [null, "los datos fiscales en ARCA y el CBU de cobro"],
  ])("no avanza de datos comerciales si falta verificar la cuenta (%j)", async (session, message) => {
    auth.sessionStatus = { is_professional: true, professional_id: 82 };
    localStorage.setItem("account_setup_step_user-1", "commercial");
    auth.refreshSession.mockResolvedValue(session);
    vi.mocked(getProfessionalMeAction).mockResolvedValue({ data: { companies: { name: "Mi negocio", tax_code: "20123456789" } } } as any);
    render(<AccountSetupPage />);
    await screen.findByText("Formulario comercial");
    fireEvent.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText("Formulario del perfil público")).not.toBeInTheDocument();
  });
});
