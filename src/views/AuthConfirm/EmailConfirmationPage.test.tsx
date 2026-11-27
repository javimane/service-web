import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmailConfirmationPage from "./EmailConfirmationPage";

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
  verify: vi.fn(),
  verifyHash: vi.fn(),
  resend: vi.fn(),
  refresh: vi.fn(),
  setUser: vi.fn(),
  setStatus: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.params,
}));
vi.mock("@/components/BrandLogo/BrandLogo", () => ({ default: () => <span>Sercio</span> }));
vi.mock("@/views/Register/RegisterPlanSelection", () => ({
  default: () => <div role="dialog" aria-label="Planes">Elegí tu plan</div>,
}));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    refreshSession: mocks.refresh, setUser: mocks.setUser, setSessionStatus: mocks.setStatus,
  }),
  normalizeSessionPayload: (response: any) => ({
    nextUser: response?.data?.user, nextSessionStatus: response?.sessionStatus,
  }),
}));
vi.mock("@/services/authService", () => ({
  authService: {
    verifyRegistrationEmail: mocks.verify,
    verifyOtp: mocks.verifyHash,
    resendRegistrationEmail: mocks.resend,
    syncOAuth: vi.fn(),
    logout: vi.fn(),
  },
}));

const response = {
  data: { user: { id: "user-1" } },
  sessionStatus: { is_professional: false },
};

describe("Email signup confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.params = new URLSearchParams("email=buyer%40example.com");
    mocks.verify.mockResolvedValue(response);
    mocks.verifyHash.mockResolvedValue(response);
    mocks.refresh.mockResolvedValue(response.sessionStatus);
  });

  it("confirms a code and continues buyer onboarding with the API session", async () => {
    render(<EmailConfirmationPage />);
    fireEvent.change(screen.getByLabelText("Código de confirmación"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y continuar" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/completar-perfil"));
    expect(mocks.verify).toHaveBeenCalledWith({ email: "buyer@example.com", token: "123456" });
    expect(mocks.setUser).toHaveBeenCalledWith({ id: "user-1" });
    expect(localStorage.getItem("show_setup_on_login")).toBe("true");
  });

  it("shows subscription plans after confirming a professional account", async () => {
    mocks.refresh.mockResolvedValue({ is_professional: true });
    render(<EmailConfirmationPage />);
    fireEvent.change(screen.getByLabelText("Código de confirmación"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y continuar" }));
    expect(await screen.findByRole("dialog", { name: "Planes" })).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("keeps the confirmation form open when a code is rejected", async () => {
    mocks.verify.mockRejectedValue(new Error("El código venció."));
    render(<EmailConfirmationPage />);
    fireEvent.change(screen.getByLabelText("Código de confirmación"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y continuar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El código venció.");
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar y continuar" })).toBeEnabled();
  });

  it("allows a resend on the standalone page and clears the previous code", async () => {
    mocks.resend.mockResolvedValue({ ok: true });
    render(<EmailConfirmationPage />);
    const code = screen.getByLabelText("Código de confirmación");
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    expect(await screen.findByRole("status")).toHaveTextContent("buyer@example.com");
    expect(mocks.resend).toHaveBeenCalledWith("buyer@example.com");
    expect(code).toHaveValue("");
    expect(screen.getByRole("button", { name: /Reenviar en/ })).toBeDisabled();
  });

  it("exchanges a confirmation link once under StrictMode", async () => {
    mocks.params = new URLSearchParams("token_hash=one-use-token&type=email");
    render(<StrictMode><EmailConfirmationPage /></StrictMode>);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/completar-perfil"));
    expect(mocks.verifyHash).toHaveBeenCalledTimes(1);
    expect(mocks.verifyHash).toHaveBeenCalledWith({ token_hash: "one-use-token", type: "email" });
  });
});
