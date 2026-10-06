import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FAQSection from "./FAQSection";

describe("FAQSection", () => {
  it("renderiza el título principal y la descripción", () => {
    render(<FAQSection />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Preguntas Frecuentes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Encuentra rápidamente la respuesta a tus dudas/i),
    ).toBeInTheDocument();
  });

  it("renderiza las 18 categorías de preguntas frecuentes", () => {
    render(<FAQSection />);

    const categories = [
      "Datos Comerciales y Verificación",
      "Productos y Catálogo",
      "Variantes de Productos",
      "Envíos Gratis y Configuración",
      "Cuotas y Financiación",
      "Sucursales e Impresión de Tickets",
      "Logística y Repartidores (Riders)",
      "Gestión de Ventas y Pedidos",
      "Compras y Seguimiento de Pedidos",
      "Liquidaciones y Datos Bancarios",
      "Tarjetas y Métodos de Pago",
      "Suscripciones y Planes",
      "Panel de Control (Dashboard)",
      "Configuración General",
      "Promociones y Descuentos",
      "Chat y Mensajes",
      "Calendario y Turnos",
      "Historias, Multimedia y Trabajos",
    ];

    categories.forEach((cat) => {
      expect(
        screen.getByRole("heading", { level: 2, name: cat }),
      ).toBeInTheDocument();
    });
  });

  it("permite abrir y cerrar categorías y visualizar las respuestas al hacer clic", () => {
    render(<FAQSection />);

    // Por defecto la primera categoría está abierta
    const firstCatButton = screen.getByRole("button", {
      name: /Datos Comerciales y Verificación/i,
    });
    expect(firstCatButton).toHaveAttribute("aria-expanded", "true");

    // Verificar que una pregunta de esa categoría está visible
    const questionText = "¿Qué son los Datos Comerciales y dónde se configuran?";
    expect(screen.getByText(questionText)).toBeInTheDocument();

    // Hacemos clic en la pregunta para expandir la respuesta
    const questionBtn = screen.getByRole("button", { name: new RegExp(questionText, "i") });
    expect(questionBtn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(questionBtn);
    expect(questionBtn).toHaveAttribute("aria-expanded", "true");

    // Verificar que el texto de la respuesta existe en el documento
    expect(
      screen.getByText(/Es la sección donde los profesionales y empresas configuran su identidad de negocio/i),
    ).toBeInTheDocument();
  });
});
