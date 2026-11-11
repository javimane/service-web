import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RidersSection from "./RidersSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock dependencies
vi.mock("@/utils/auth", () => ({
  getAccessToken: () => "mock-token",
}));

vi.mock("@/services/apiClient", () => ({
  setApiAccessToken: vi.fn(),
}));

vi.mock("@/context/AlertContext", () => ({
  useAlert: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("@/services/commerceService", () => ({
  commerceService: {
    employees: vi.fn().mockResolvedValue([
      {
        id: "rider-1",
        first_name: "Carlos",
        last_name: "Gómez",
        username: "carlos_g",
        phone: "1122334455",
        status: "active",
        verification_status: "verified",
        vehicle: {
          vehicle_type: "motorcycle",
          license_plate: "A123BCD",
        },
      },
    ]),
    fleetVehicles: vi.fn().mockResolvedValue([
      {
        id: "veh-1",
        vehicle_type: "car",
        brand: "Renault",
        model: "Kangoo",
        is_active: true,
        documents: [],
      },
    ]),
    documents: vi.fn().mockResolvedValue([]),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
  },
}));

vi.mock("./FleetVehiclesPanel", () => ({
  default: () => <div data-testid="fleet-vehicles-panel">Panel de Vehículos de la empresa</div>,
}));

describe("RidersSection - Organización de la pantalla con 3 botones", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <RidersSection />
      </QueryClientProvider>,
    );

  it("renderiza arriba los 3 botones principales: Personal, Vehículos de la empresa, Dar de alta Rider", async () => {
    renderComponent();

    expect(screen.getByRole("tab", { name: /Personal/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Vehículos de la empresa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Dar de alta Rider/i }),
    ).toBeInTheDocument();
  });

  it("inicia mostrando la pestaña Personal por defecto", async () => {
    renderComponent();

    const personalTab = screen.getByRole("tab", { name: /Personal/i });
    expect(personalTab).toHaveAttribute("aria-selected", "true");

    // Debe mostrar la cabecera o lista del personal
    expect(await screen.findByText(/Personal de logística/i)).toBeInTheDocument();
  });

  it("al hacer clic en 'Vehículos de la empresa', muestra el panel de vehículos de flota", async () => {
    renderComponent();

    const vehiclesBtn = screen.getByRole("tab", {
      name: /Vehículos de la empresa/i,
    });
    fireEvent.click(vehiclesBtn);

    expect(vehiclesBtn).toHaveAttribute("aria-selected", "true");
    expect(
      await screen.findByTestId("fleet-vehicles-panel"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Personal de logística/i)).not.toBeInTheDocument();
  });

  it("al hacer clic en 'Dar de alta Rider', muestra el formulario de alta", async () => {
    renderComponent();

    const createBtn = screen.getByRole("tab", {
      name: /Dar de alta Rider/i,
    });
    fireEvent.click(createBtn);

    expect(createBtn).toHaveAttribute("aria-selected", "true");
    expect(
      await screen.findByRole("heading", { name: /Dar de alta rider/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Apellido \*/i)).toBeInTheDocument();
  });
});
