"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import type { OrderSummary } from "@/services/commerceService";
import {
  getOrderMessagesAction,
  sendOrderMessageAction,
  markOrderMessagesAsReadAction,
} from "@/app/actions/chat";
import { sendNotificationAction } from "@/app/actions/notifications";
import { getProfessionalDetailAction } from "@/app/actions/professionals";
import { getBuyerName } from "./orderTicketData";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/utils/auth";
import "./OrderChatModal.css";

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderSummary;
  currentUserId: string;
}

export default function OrderChatModal({
  isOpen,
  onClose,
  order,
  currentUserId,
}: OrderChatModalProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const { showError } = useAlert();
  const { user, sessionStatus } = useAuth();

  const buyerUserId =
    order.user_id ||
    order.buyer?.id ||
    order.user?.id ||
    "";
  const buyerName = getBuyerName(order);
  const orderRef = order.order_number || order.id.slice(0, 8);

  const isBuyer =
    Boolean(currentUserId) &&
    Boolean(buyerUserId) &&
    String(currentUserId) === String(buyerUserId);

  // If current user is buyer, lookup professional detail to obtain seller user_id
  const { data: professionalDetail } = useQuery({
    queryKey: ["order-professional-detail", order.professional_id],
    queryFn: async () => {
      if (!order.professional_id) return null;
      const res = await getProfessionalDetailAction({ id: order.professional_id });
      return res?.data ?? null;
    },
    enabled: isOpen && isBuyer && Boolean(order.professional_id),
    staleTime: 1000 * 60 * 10,
  });

  const sellerUserId =
    (order as any).professional?.user_id ||
    (order as any).seller_user_id ||
    (order as any).merchant_user_id ||
    professionalDetail?.user_id ||
    "";

  const sellerName =
    (order as any).professional?.Company?.name ||
    (order as any).professional?.name ||
    professionalDetail?.companies?.[0]?.name ||
    professionalDetail?.name ||
    "Comercio";

  const targetReceiverId = isBuyer ? sellerUserId : buyerUserId;
  const otherPartyName = isBuyer ? sellerName : buyerName;
  const otherPartyRole = isBuyer ? "Comercio" : "Cliente";

  const {
    data: messages = [],
    isLoading,
  } = useQuery({
    queryKey: ["order-messages", order.id],
    queryFn: async () => {
      const res = await getOrderMessagesAction({ orderId: order.id });
      if (res?.data && currentUserId) {
        void markOrderMessagesAsReadAction({
          orderId: order.id,
          userId: currentUserId,
        });
      }
      return res?.data ?? [];
    },
    enabled: isOpen && Boolean(order.id),
    refetchInterval: isOpen ? 3000 : false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!text.trim()) return;
      if (!targetReceiverId) {
        throw new Error("No se pudo identificar al destinatario del mensaje en este pedido.");
      }

      const res = await sendOrderMessageAction({
        senderId: currentUserId,
        receiverId: targetReceiverId,
        orderId: order.id,
        content: text.trim(),
      });

      // Enviar notificación al destinatario tal como en el chat general
      try {
        const token = getAccessToken();
        const senderDisplayName = isBuyer
          ? (user?.user_metadata?.full_name || sessionStatus?.display_name || "Cliente")
          : (sessionStatus?.company_name || sessionStatus?.display_name || user?.user_metadata?.full_name || "Comercio");

        await sendNotificationAction({
          user_id: targetReceiverId,
          sender_id: currentUserId,
          type: "message",
          title: `${senderDisplayName} (Pedido #${orderRef})`,
          content: text.trim(),
          source_id: String(res?.data?.id || order.id),
          token,
        });
      } catch (notifErr) {
        console.warn("Could not dispatch notification for order message:", notifErr);
      }

      return res;
    },
    onSuccess: () => {
      setInputText("");
      queryClient.invalidateQueries({
        queryKey: ["order-messages", order.id],
      });
    },
    onError: (err: any) => {
      showError(err?.message || "No se pudo enviar el mensaje.");
    },
  });

  const handleSend = () => {
    if (!inputText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chat del Pedido #${orderRef}`}
    >
      <div className="order-chat-modal">
        <div className="order-chat-modal__banner">
          <ShieldAlert size={16} className="order-chat-modal__banner-icon" />
          <span>
            Chat exclusivo del pedido. La conversación queda resguardada como constancia ante reclamos o aclaraciones del envío.
          </span>
        </div>

        <div className="order-chat-modal__meta">
          <span>
            {otherPartyRole}:{" "}
            <strong className="order-chat-modal__meta-customer">
              {otherPartyName}
            </strong>
          </span>
          <span>Pedido #{orderRef}</span>
        </div>

        <div className="order-chat-modal__messages">
          {isLoading && messages.length === 0 ? (
            <div className="order-chat-modal__loading">
              <Loader2 className="animate-spin" size={24} />
              <span>Cargando conversación...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="order-chat-modal__empty">
              <MessageSquare size={32} />
              <p>Aún no hay mensajes en esta venta.</p>
              <span>
                {isBuyer
                  ? "Escribile al comercio para consultar sobre tu entrega, dudas del producto o coordinar el retiro."
                  : "Escribile al cliente para coordinar entrega, detalles del producto o despejar dudas."}
              </span>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = String(msg.sender_id) === String(currentUserId);
              const timeStr = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={msg.id}
                  className={`order-chat-modal__bubble ${
                    isMe
                      ? "order-chat-modal__bubble--me"
                      : "order-chat-modal__bubble--other"
                  }`}
                >
                  <span className="order-chat-modal__text">{msg.content}</span>
                  {timeStr && (
                    <span className="order-chat-modal__time">{timeStr}</span>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="order-chat-modal__input-bar">
          <input
            type="text"
            className="order-chat-modal__input"
            placeholder={
              isBuyer
                ? "Escribí un mensaje para el comercio..."
                : "Escribí un mensaje para el cliente..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sendMessageMutation.isPending}
          />
          <button
            type="button"
            className="order-chat-modal__send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>Enviar</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
