import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardSidebar from "./DashboardSidebar";

const { auth, push } = vi.hoisted(() => ({
  auth: {
    user: { id: "user-1", email: "user@example.com" },
    sessionStatus: { is_professional: false, professional_active: false, role_id: 2 },
    hasProfessionalSubscription: false,
    subscriptionPlan: null as string | null,
    logout: vi.fn(),
  },
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: null }) }));
vi.mock("../../context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/context/AlertContext", () => ({ useAlert: () => ({ showError: vi.fn() }) }));
vi.mock("../Modal/Modal", () => ({
  default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));

describe("DashboardSidebar visibility", () => {
  beforeEach(() => {
    auth.sessionStatus.is_professional = false;
    auth.sessionStatus.professional_active = false;
    auth.hasProfessionalSubscription = false;
    auth.subscriptionPlan = null;
    push.mockReset();
  });

  it("shows buyer actions and general account options without professional creation tools", () => {
    render(<DashboardSidebar />);
    expect(screen.getByRole("button", { name: "COMPRAS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CARRITO" })).toBeInTheDocument();
    for (const label of ["SUSCRIPCIÓN", "REFERIDOS", "CONFIGURACIÓN", "AYUDA", "PREGUNTAS FRECUENTES", "REPORTAR PROBLEMA", "SOPORTE"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    for (const label of ["VENTAS", "PERFIL", "Crear Presupuesto"]) {
      expect(screen.queryByRole("button", { name: label })).not.toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "PRESUPUESTOS" }));
    expect(screen.getByRole("button", { name: "Ver Presupuestos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Crear Presupuesto" })).not.toBeInTheDocument();
  });

  it("opens support from the mobile sidebar", () => {
    render(<DashboardSidebar isMobile isMobileOpen />);
    fireEvent.click(screen.getByRole("button", { name: "AYUDA" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Enviar Email");
  });

  it("keeps subscription accessible to a professional without an active plan", () => {
    auth.sessionStatus.is_professional = true;
    render(<DashboardSidebar />);
    fireEvent.click(screen.getByRole("button", { name: "SUSCRIPCIÓN" }));
    expect(push).toHaveBeenCalledWith(expect.stringContaining("view=subscription"));
  });
});
