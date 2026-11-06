vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LegalConsentGate from "./LegalConsentGate";
const { auth, get, accept, route } = vi.hoisted(() => ({
  auth: {
    user: { id: "user-1" } as { id: string } | null,
    loading: false,
    logout: vi.fn(),
  },
  route: { pathname: "/" },
  get: vi.fn(),
  accept: vi.fn(),
}));
vi.mock("../../context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../../services/legalConsentService", () => ({
  legalConsentService: { get, accept },
}));
const pending = {
  accepted_terms: true,
  accepted_privacy: false,
  requires_legal_consent: true,
};
const approved = {
  accepted_terms: true,
  accepted_privacy: true,
  requires_legal_consent: false,
};
function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <LegalConsentGate />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  route.pathname = "/";
  auth.user = { id: "user-1" };
  get.mockResolvedValue(pending);
  accept.mockResolvedValue(approved);
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
});
describe("LegalConsentGate", () => {
  it.each(["/terminos", "/privacidad"])(
    "allows reading %s before accepting",
    (pathname) => {
      route.pathname = pathname;
      mount();
      expect(get).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );
  it("does not prompt guests or users who already accepted both documents", async () => {
    auth.user = null;
    const view = mount();
    expect(get).not.toHaveBeenCalled();
    view.unmount();
    auth.user = { id: "user-1" };
    get.mockResolvedValue(approved);
    mount();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("requires both checkboxes and persists explicit acceptance before closing", async () => {
    mount();
    const button = await screen.findByRole("button", {
      name: "Aceptar y continuar",
    });
    expect(button).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /términos y condiciones/ }),
    );
    expect(button).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /política de privacidad/ }),
    );
    fireEvent.click(button);
    await waitFor(() => expect(accept).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("keeps the prompt and enables retry if the acceptance write fails", async () => {
    accept.mockRejectedValue(new Error("Offline"));
    mount();
    await screen.findByRole("button", { name: "Aceptar y continuar" });
    for (const box of screen.getAllByRole("checkbox")) fireEvent.click(box);
    fireEvent.click(
      screen.getByRole("button", { name: "Aceptar y continuar" }),
    );
    await screen.findByRole("alert");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Aceptar y continuar" }),
    ).toBeEnabled();
  });
  it("allows retrying a failed status check and signing out", async () => {
    get.mockRejectedValueOnce(new Error("Offline"));
    mount();
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    fireEvent.click(retry);
    await screen.findByRole("button", { name: "Aceptar y continuar" });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });
});
