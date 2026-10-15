import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DenunciasSection from "./DenunciasSection";
import { listingReportsService } from "@/services/listingReportsService";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock listingReportsService
vi.mock("@/services/listingReportsService", () => ({
  listingReportsService: {
    getMyReports: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockReports = [
  {
    id: "rep-1",
    target_type: "professional_product",
    target_id: "prod-1",
    target_title: "Taladro Percutor 750W",
    target_snapshot: {
      title: "Taladro Percutor 750W",
      description: "Taladro de alta potencia industrial",
    },
    reason: "misleading",
    details: "El producto dice 750W pero la caja indica otra potencia",
    status: "pending",
    created_at: "2026-10-14T10:00:00Z",
    reviewed_at: null,
  },
  {
    id: "rep-2",
    target_type: "professional_publication",
    target_id: "pub-1",
    target_title: "Promoción Fin de Semana",
    target_snapshot: {
      title: "Promoción Fin de Semana",
      description: "Descuentos en servicios",
    },
    reason: "inappropriate",
    details: "Foto fuera de contexto",
    status: "dismissed",
    admin_notes: "Revisamos tu publicación y no se encontraron irregularidades.",
    created_at: "2026-10-12T08:30:00Z",
    reviewed_at: "2026-10-13T12:00:00Z",
  },
];

describe("DenunciasSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el banner de protección y el listado de denuncias", async () => {
    vi.mocked(listingReportsService.getMyReports).mockResolvedValue(mockReports);

    renderWithClient(<DenunciasSection />);

    expect(await screen.findByText("Denuncias Recibidas")).toBeInTheDocument();
    expect(
      screen.getByText("Protección y Moderación Sercio")
    ).toBeInTheDocument();

    // Verify reports rendered
    expect(await screen.findByText("Taladro Percutor 750W")).toBeInTheDocument();
    expect(screen.getByText("Promoción Fin de Semana")).toBeInTheDocument();
    expect(screen.getByText("Información engañosa")).toBeInTheDocument();
    expect(screen.getByText("Contenido inapropiado")).toBeInTheDocument();
    expect(screen.getByText("Mensaje de Sercio:")).toBeInTheDocument();
    expect(
      screen.getByText("Revisamos tu publicación y no se encontraron irregularidades.")
    ).toBeInTheDocument();
  });

  it("filtra por tipo de contenido y por estado", async () => {
    vi.mocked(listingReportsService.getMyReports).mockResolvedValue(mockReports);

    renderWithClient(<DenunciasSection />);

    await screen.findByText("Taladro Percutor 750W");

    // Filter by Productos
    const productosFilter = screen.getByRole("button", {
      name: /Productos \(1\)/i,
    });
    fireEvent.click(productosFilter);

    expect(screen.getByText("Taladro Percutor 750W")).toBeInTheDocument();
    expect(screen.queryByText("Promoción Fin de Semana")).not.toBeInTheDocument();

    // Filter by Resueltas
    const resueltasFilter = screen.getByRole("button", {
      name: /Resueltas \(1\)/i,
    });
    fireEvent.click(resueltasFilter);

    // Producto is pending, not resolved -> empty filtered state
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay denuncias", async () => {
    vi.mocked(listingReportsService.getMyReports).mockResolvedValue([]);

    renderWithClient(<DenunciasSection />);

    expect(
      await screen.findByText("¡Sin denuncias registradas!")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tu catálogo mantiene un excelente estándar de calidad/i)
    ).toBeInTheDocument();
  });

  it("abre el modal de detalle al hacer clic en una denuncia", async () => {
    vi.mocked(listingReportsService.getMyReports).mockResolvedValue(mockReports);

    renderWithClient(<DenunciasSection />);

    const reportCard = await screen.findByRole("button", {
      name: /Ver detalle de denuncia sobre Taladro Percutor 750W/i,
    });
    fireEvent.click(reportCard);

    // Modal opens
    expect(screen.getByText("Detalle de la Denuncia")).toBeInTheDocument();
    expect(
      screen.getByText("El producto dice 750W pero la caja indica otra potencia")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Taladro de alta potencia industrial")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Esta denuncia fue recibida y se encuentra a la espera/i)
    ).toBeInTheDocument();

    // Close button works
    const closeBtn = screen.getByRole("button", { name: "Cerrar" });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Detalle de la Denuncia")).not.toBeInTheDocument();
    });
  });
});
