"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Paperclip,
  Mic,
  Smile,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import NavbarMessage from "../../components/Navbar/NavBar Messaje/NavbarMessage";
import {
  createRequestAction,
  getRequestMessagesAction,
  getUserRequestsAction,
  sendMessageAction,
} from "../../app/actions/communications";
import "./MessagesPage.css";

type UIConversation = {
  id: string;
  requestId?: string;
  professionalId?: number;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
  time: string;
  lastMessage: string;
};

type UIMessage = {
  id: string;
  sender: "me" | "other";
  text: string;
  time: string;
  date?: string;
  status?: string;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "US";

const formatTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
};

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const targetProfessional =
    searchParams?.get("to") || searchParams?.get("professionalId");
  const requestIdParam = searchParams?.get("requestId");

  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: requestsData } = useQuery({
    queryKey: ["my-contact-requests", user?.id],
    queryFn: async () => {
      const result = await getUserRequestsAction({ userId: user!.id });
      return result?.data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 segundos (datos en tiempo real)
    gcTime: 1000 * 60 * 2,
  });

  const requests = useMemo(() => {
    if (!requestsData) return [] as any[];
    if (Array.isArray(requestsData)) return requestsData;
    const payload = requestsData as any;
    if (Array.isArray(payload.data)) return payload.data;
    return [] as any[];
  }, [requestsData]);

  const conversations = useMemo<UIConversation[]>(() => {
    const mapped = requests.map((req: any) => {
      const professional = req.Professional as any;
      const companyData =
        professional?.Company ||
        professional?.Companies ||
        professional?.company ||
        professional?.companies;
      const company = Array.isArray(companyData) ? companyData[0] : companyData;
      const name =
        company?.name ||
        professional?.Profile?.display_name ||
        `Profesional ${req.professional_id ?? ""}`;

      return {
        id: String(req.id),
        requestId: String(req.id),
        professionalId: Number(req.professional_id),
        name,
        role: "Profesional",
        avatar: getInitials(name),
        online: false,
        time: formatTime(req.updated_at || req.created_at),
        lastMessage: req.message || "Abri la conversacion para ver mensajes",
      };
    });

    if (mapped.length === 0 && targetProfessional) {
      const name = `Profesional ${targetProfessional}`;
      mapped.push({
        id: `draft-${targetProfessional}`,
        professionalId: Number(targetProfessional),
        name,
        role: "Profesional",
        avatar: getInitials(name),
        online: false,
        time: "",
        lastMessage: "Envia el primer mensaje para iniciar el chat",
      });
    }

    return mapped;
  }, [requests, targetProfessional]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    null;

  useEffect(() => {
    if (!conversations.length) return;
    if (activeConversationId) return;

    if (requestIdParam) {
      const byParam = conversations.find((c) => c.requestId === requestIdParam);
      if (byParam) {
        setActiveConversationId(byParam.id);
        return;
      }
    }

    setActiveConversationId(conversations[0].id);
  }, [conversations, activeConversationId, requestIdParam]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [conversations, searchQuery],
  );

  const activeRequestId = activeConversation?.requestId;

  const { data: messagesData = [] } = useQuery({
    queryKey: ["chat-messages", activeRequestId],
    queryFn: async () => {
      const result = await getRequestMessagesAction({
        requestId: activeRequestId!,
      });
      return result?.data ?? [];
    },
    enabled: !!activeRequestId,
    staleTime: 1000 * 30, // 30 segundos (datos en tiempo real)
    gcTime: 1000 * 60 * 2,
  });

  const messages = useMemo<UIMessage[]>(() => {
    const list = Array.isArray(messagesData)
      ? messagesData
      : Array.isArray((messagesData as any)?.data)
        ? (messagesData as any).data
        : [];

    let lastDate = "";
    return list.map((msg: any) => {
      const msgDate = formatDate(msg.created_at);
      const showDate = msgDate && msgDate !== lastDate;
      if (msgDate) lastDate = msgDate;

      return {
        id: String(msg.id),
        sender: msg.sender_id === user?.id ? "me" : "other",
        text: msg.content,
        time: formatTime(msg.created_at),
        date: showDate ? msgDate : "",
        status: msg.is_read ? "Leido" : undefined,
      };
    });
  }, [messagesData, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (activeRequestId) {
        const result = await sendMessageAction({
          requestId: activeRequestId,
          content,
        });
        return result?.data;
      }

      if (!activeConversation?.professionalId) {
        throw new Error("No se pudo determinar el profesional destino.");
      }

      const createdResult = await createRequestAction({
        professional_id: activeConversation.professionalId,
        message: content,
      });
      const created = createdResult?.data;

      const createdId = String(
        (created as any)?.id || (created as any)?.data?.id || "",
      );
      if (createdId) {
        setActiveConversationId(createdId);
      }

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-contact-requests", user?.id],
      });
      if (activeRequestId) {
        queryClient.invalidateQueries({
          queryKey: ["chat-messages", activeRequestId],
        });
      }
    },
  });

  const handleSend = () => {
    const content = newMessage.trim();
    if (!content) return;
    sendMessageMutation.mutate(content);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = (conv: UIConversation) => {
    setActiveConversationId(conv.id);
    setMobileShowChat(true);
  };

  return (
    <div className="msg-app">
      <NavbarMessage />
      <div className="msg-app__container">
        <header className="msg-topbar">
          <div className="msg-topbar__left">
            <button
              className="msg-topbar__back"
              onClick={() => router.back()}
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="msg-topbar__title">Mensajes</h1>
          </div>

          <div className="msg-topbar__right">
            <div
              className={`msg-topbar__search ${searchOpen ? "msg-topbar__search--open" : ""}`}
            >
              {searchOpen && (
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              )}
              <button
                className="msg-topbar__icon-btn"
                onClick={() => {
                  setSearchOpen((v) => !v);
                  if (searchOpen) setSearchQuery("");
                }}
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        </header>

        <div
          className={`msg-layout ${sidebarCollapsed ? "msg-layout--collapsed" : ""} ${mobileShowChat ? "msg-layout--chat-active" : ""}`}
        >
          <aside
            className={`msg-panel ${sidebarCollapsed ? "msg-panel--collapsed" : ""}`}
          >
            <div className="msg-panel__header">
              {!sidebarCollapsed && (
                <span className="msg-panel__count">
                  {conversations.length} conversaciones
                </span>
              )}
              <button
                type="button"
                className="msg-panel__toggle"
                onClick={() => setSidebarCollapsed((v) => !v)}
                aria-label={
                  sidebarCollapsed ? "Expandir panel" : "Colapsar panel"
                }
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen size={16} />
                ) : (
                  <PanelLeftClose size={16} />
                )}
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="msg-panel__list">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`msg-conv ${activeConversation?.id === conv.id ? "msg-conv--active" : ""}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="msg-conv__avatar">
                      {conv.avatar}
                      {conv.online && <span className="msg-online-dot" />}
                    </div>
                    <div className="msg-conv__body">
                      <div className="msg-conv__row">
                        <span className="msg-conv__name">{conv.name}</span>
                        <span className="msg-conv__time">{conv.time}</span>
                      </div>
                      <p className="msg-conv__preview">{conv.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {sidebarCollapsed && (
              <div className="msg-panel__avatars">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`msg-avatar-btn ${activeConversation?.id === conv.id ? "msg-avatar-btn--active" : ""}`}
                    onClick={() => handleSelectConversation(conv)}
                    title={conv.name}
                  >
                    <div className="msg-conv__avatar">
                      {conv.avatar}
                      {conv.online && <span className="msg-online-dot" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <main className="msg-chat">
            <div className="msg-chat__header">
              <button
                className="msg-chat__back-mobile"
                onClick={() => setMobileShowChat(false)}
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="msg-chat__header-avatar">
                {activeConversation?.avatar || "--"}
                {activeConversation?.online && (
                  <span className="msg-online-dot" />
                )}
              </div>
              <div className="msg-chat__header-info">
                <span className="msg-chat__header-name">
                  {activeConversation?.name || "Selecciona una conversacion"}
                </span>
                <span className="msg-chat__header-status">
                  {activeConversation
                    ? `${activeConversation.online ? "En linea" : "Desconectado"} · ${activeConversation.role}`
                    : ""}
                </span>
              </div>
              <div className="msg-chat__header-actions">
                <button className="msg-topbar__icon-btn" aria-label="Llamar">
                  <Phone size={18} />
                </button>
                <button
                  className="msg-topbar__icon-btn"
                  aria-label="Videollamada"
                >
                  <Video size={18} />
                </button>
                <button
                  className="msg-topbar__icon-btn"
                  aria-label="Mas opciones"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="msg-chat__messages">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.date && (
                    <div className="msg-date-sep">
                      <span>{msg.date}</span>
                    </div>
                  )}
                  <div
                    className={`msg-bubble-wrap ${msg.sender === "me" ? "msg-bubble-wrap--sent" : "msg-bubble-wrap--received"}`}
                  >
                    <div
                      className={`msg-bubble ${msg.sender === "me" ? "msg-bubble--sent" : "msg-bubble--received"}`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="msg-bubble__time">
                      {msg.time}
                      {msg.status && ` · ${msg.status}`}
                    </span>
                  </div>
                </div>
              ))}
              {!messages.length && (
                <div className="msg-date-sep">
                  <span>Sin mensajes todavia</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="msg-input">
              <button className="msg-input__icon" aria-label="Adjuntar archivo">
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                className="msg-input__field"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="msg-input__icon" aria-label="Mensaje de voz">
                <Mic size={20} />
              </button>
              <button className="msg-input__icon" aria-label="Emoji">
                <Smile size={20} />
              </button>
              <button
                className="msg-input__send"
                onClick={handleSend}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                aria-label="Enviar mensaje"
              >
                <Send size={18} />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
