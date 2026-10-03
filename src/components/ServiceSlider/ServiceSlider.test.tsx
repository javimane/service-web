import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ServiceSlider from "./ServiceSlider";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock FavoriteButton
vi.mock("../FavoriteButton/FavoriteButton", () => ({
  default: () => <button data-testid="favorite-button">Fav</button>,
}));

describe("ServiceSlider", () => {
  const sampleServices = [
    {
      id: "svc-1",
      name: "Instalación de Aire Acondicionado",
      base_price: 65000,
      professional: {
        id: 10,
        companies: [{ name: "Climatizaciones Mendoza" }],
        address: [{ province: { name: "Mendoza" } }],
      },
    },
    {
      id: "svc-2",
      name: "Mantenimiento Preventivo Split",
      base_price: 35000,
      professional: {
        id: 10,
        companies: [{ name: "Climatizaciones Mendoza" }],
        address: [{ province: { name: "Mendoza" } }],
      },
    },
  ];

  it("no renderiza nada si no hay servicios y no está cargando", () => {
    const { container } = render(
      <ServiceSlider title="Más Servicios" services={[]} isLoading={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el estado de carga cuando isLoading es true", () => {
    render(
      <ServiceSlider title="Más Servicios" services={[]} isLoading={true} />,
    );
    expect(screen.getByText("Cargando servicios...")).toBeInTheDocument();
    expect(screen.getByText("Más Servicios")).toBeInTheDocument();
  });

  it("renderiza el título, subtítulo, link y las tarjetas de servicios", () => {
    render(
      <ServiceSlider
        title="Más Servicios del mismo Profesional"
        subtitle="Otros servicios ofrecidos por Climatizaciones Mendoza"
        services={sampleServices}
        viewAllLink="/perfil/climatizaciones-mendoza"
        viewAllText="Ver perfil"
      />,
    );

    expect(
      screen.getByText("Más Servicios del mismo Profesional"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Otros servicios ofrecidos por Climatizaciones Mendoza"),
    ).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByText("Ver perfil")).toBeInTheDocument();
    expect(
      screen.getByText("Instalación de Aire Acondicionado"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mantenimiento Preventivo Split"),
    ).toBeInTheDocument();
  });

  it("llama al callback onServiceClick cuando se hace click en una tarjeta", () => {
    const handleClick = vi.fn();
    render(
      <ServiceSlider
        title="Servicios Similares"
        services={sampleServices}
        onServiceClick={handleClick}
      />,
    );

    const firstServiceCard = screen.getByText(
      "Instalación de Aire Acondicionado",
    );
    fireEvent.click(firstServiceCard);
    expect(handleClick).toHaveBeenCalledWith(sampleServices[0]);
  });
});
