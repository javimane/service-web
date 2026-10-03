import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OrderChatModal from "./OrderChatModal";
import type { OrderSummary } from "@/services/commerceService";
import { getOrderMessagesAction, sendOrderMessageAction } from "@/app/actions/chat";
import { sendNotificationAction } from "@/app/actions/notifications";

vi.mock("@/app/actions/chat", () => ({
  getOrderMessagesAction: vi.fn(),
  sendOrderMessageAction: vi.fn(),
  markOrderMessagesAsReadAction: vi.fn(),
}));

vi.mock("@/app/actions/notifications", () => ({
  sendNotificationAction: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/app/actions/professionals", () => ({
  getProfessionalDetailAction: vi.fn().mockResolvedValue({
    data: {
      user_id: "seller-user-789",
      name: "Ferretería Central",
    },
  }),
}));

vi.mock("@/context/AlertContext", () => ({
  useAlert: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "seller-user-789", user_metadata: { full_name: "Ferretería Central" } },
    sessionStatus: { company_name: "Ferretería Central" },
  }),
}));

vi.mock("@/utils/auth", () => ({
  getAccessToken: vi.fn().mockReturnValue("fake-token"),
}));

describe("OrderChatModal", () => {
  let queryClient: QueryClient;

  const mockOrder: OrderSummary = {
    id: "order-12345",
    order_number: "V-98765",
    status: "confirmed",
    delivery_type: "shipment",
    total_amount: 15000,
    created_at: "2026-09-29T10:00:00Z",
    quantity: 1,
    user_id: "buyer-user-456",
    buyer: {
      id: "buyer-user-456",
      first_name: "Juan",
      last_name: "Pérez",
      email: "juan@example.com",
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it("renderiza el modal con los datos del cliente y los mensajes de la venta", async () => {
    vi.mocked(getOrderMessagesAction).mockResolvedValueOnce({
      data: [
        {
          id: "msg-1",
          sender_id: "buyer-user-456",
          receiver_id: "seller-user-789",
          content: "Hola, ¿cuándo despachan el pedido?",
          created_at: "2026-09-29T10:05:00Z",
          is_read: false,
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OrderChatModal
          isOpen={true}
          onClose={vi.fn()}
          order={mockOrder}
          currentUserId="seller-user-789"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Chat del Pedido #V-98765")).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();

    const messageText = await screen.findByText("Hola, ¿cuándo despachan el pedido?");
    expect(messageText).toBeInTheDocument();
  });

  it("permite enviar un mensaje nuevo asociado a la venta y despacha una notificación", async () => {
    vi.mocked(getOrderMessagesAction).mockResolvedValueOnce({
      data: [],
    });
    vi.mocked(sendOrderMessageAction).mockResolvedValueOnce({
      data: {
        id: "msg-2",
        sender_id: "seller-user-789",
        receiver_id: "buyer-user-456",
        order_id: "order-12345",
        content: "Hola Juan, sale hoy por la tarde!",
        created_at: "2026-09-29T10:10:00Z",
        is_read: false,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OrderChatModal
          isOpen={true}
          onClose={vi.fn()}
          order={mockOrder}
          currentUserId="seller-user-789"
        />
      </QueryClientProvider>,
    );

    const input = screen.getByPlaceholderText("Escribí un mensaje para el cliente...");
    const sendBtn = screen.getByRole("button", { name: /Enviar/i });

    fireEvent.change(input, { target: { value: "Hola Juan, sale hoy por la tarde!" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(sendOrderMessageAction).toHaveBeenCalledWith({
        senderId: "seller-user-789",
        receiverId: "buyer-user-456",
        orderId: "order-12345",
        content: "Hola Juan, sale hoy por la tarde!",
      });

      expect(sendNotificationAction).toHaveBeenCalledWith({
        user_id: "buyer-user-456",
        sender_id: "seller-user-789",
        type: "message",
        title: "Ferretería Central (Pedido #V-98765)",
        content: "Hola Juan, sale hoy por la tarde!",
        source_id: "msg-2",
        token: "fake-token",
      });
    });
  });
});
