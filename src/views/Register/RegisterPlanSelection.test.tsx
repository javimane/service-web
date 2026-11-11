import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPlanSelection from "./RegisterPlanSelection";
import { ROUTES } from "@/routes/paths";

const mocks = vi.hoisted(() => ({
  push: vi.fn(), refresh: vi.fn(), refreshSession: vi.fn(), createProfessional: vi.fn(),
  prices: vi.fn(), mpPlans: vi.fn(), createSubscription: vi.fn(), redirect: vi.fn(),
  auth: { user: { email: "persona@example.com" }, sessionStatus: { email: "persona@example.com" } } as any,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ ...mocks.auth, refreshSession: mocks.refreshSession }) }));
vi.mock("@/app/actions/plans", () => ({ getSubscriptionPricesAction: mocks.prices }));
vi.mock("@/app/actions/mercadopago", () => ({ getMercadoPagoPlansAction: mocks.mpPlans, createMercadoPagoSubscriptionAction: mocks.createSubscription }));
vi.mock("@/app/actions/professionals", () => ({ createProfessionalMeAction: mocks.createProfessional }));
vi.mock("@/utils/subscriptionCheckout", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/utils/subscriptionCheckout")>(),
  redirectToSubscriptionCheckout: mocks.redirect,
}));

async function choosePlan(name: string) {
  const card = screen.getByRole("heading", { name }).closest(".subscription-plans__card")! as HTMLElement;
  const button = within(card).getByRole("button", { name: "Elegir plan" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  const dialog = screen.getByRole("dialog", { name: "Requisitos para una cuenta profesional" });
  fireEvent.click(within(dialog).getByRole("checkbox"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
}

describe("subscription plan selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.auth = { user: { email: "persona@example.com" }, sessionStatus: { email: "persona@example.com" } };
    mocks.prices.mockResolvedValue({ data: [] });
    mocks.mpPlans.mockResolvedValue({ data: { "PROFESIONAL-BASICO": "basic-mp", "PROFESIONAL-PREMIUM": "premium-mp" } });
    mocks.createProfessional.mockResolvedValue({ data: { id: 82 } });
    mocks.createSubscription.mockResolvedValue({ data: { initPoint: "https://www.mercadopago.com.ar/subscription" } });
    mocks.refreshSession.mockResolvedValue({ is_professional: true });
  });

  it("renders outside a narrow parent and shows the requirements above the plan selector", async () => {
    const { container } = render(<div><RegisterPlanSelection /></div>);
    expect(container.querySelector(".register-plan-selection")).toBeNull();
    const selector = screen.getByRole("dialog", { name: "Elegí tu plan profesional" });
    expect(selector.querySelectorAll(".subscription-plans__grid > .subscription-plans__card")).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("button", { name: "Elegir plan" })[0]);
    const requirements = screen.getByRole("dialog", { name: "Requisitos para una cuenta profesional" });
    expect(requirements.parentElement?.parentElement).toBe(document.body);
    expect(mocks.createProfessional).not.toHaveBeenCalled();
    fireEvent.click(within(requirements).getByRole("button", { name: "Volver" }));
    expect(screen.queryByRole("dialog", { name: "Requisitos para una cuenta profesional" })).not.toBeInTheDocument();
  });

  it("activates the free plan and opens account setup after confirmation", async () => {
    mocks.refreshSession.mockImplementationOnce(async () => {
      expect(localStorage.getItem("show_setup_on_login")).toBe("true");
      return { is_professional: true };
    });
    render(<RegisterPlanSelection />);
    await choosePlan("Gratuito");
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(ROUTES.accountSetup));
    expect(mocks.createProfessional).toHaveBeenCalledTimes(1);
    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("show_setup_on_login")).toBe("true");
  });

  it.each([["Profesional Básico", "basic-mp"], ["Profesional Premium", "premium-mp"]])("starts %s with the real email and the API initPoint", async (name, planId) => {
    render(<RegisterPlanSelection />);
    await choosePlan(name);
    await waitFor(() => expect(mocks.redirect).toHaveBeenCalledWith("https://www.mercadopago.com.ar/subscription"));
    expect(mocks.createSubscription).toHaveBeenCalledWith({ email: "persona@example.com", planId });
  });

  it("does not proceed when activating the free plan fails", async () => {
    mocks.createProfessional.mockResolvedValue({ serverError: "No se pudo activar el plan gratuito" });
    render(<RegisterPlanSelection />);
    await choosePlan("Gratuito");
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo activar el plan gratuito");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("shows an error when the paid checkout has no redirect URL", async () => {
    mocks.createSubscription.mockResolvedValue({ serverError: "No disponible" });
    render(<RegisterPlanSelection />);
    await choosePlan("Profesional Básico");
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo iniciar el pago del plan");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("takes a guest to registration when choosing a plan", async () => {
    mocks.auth = { user: null, sessionStatus: null };
    const onClose = vi.fn();
    render(<RegisterPlanSelection onClose={onClose} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Elegir plan" })[0]);
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith(ROUTES.register);
  });
});
