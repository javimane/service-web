import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Paperclip,
  Mic,
  Smile,
  Send,
  ImageIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../routes/paths";
import "./MessagesPage.css";

const conversations = [
  {
    id: 1,
    name: "Julian Vargas",
    role: "Arquitecto & Diseñador",
    avatar: "JV",
    lastMessage: "Los planos del proyecto están...",
    time: "2H",
    online: true,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "¡Hola! Acabo de finalizar los conceptos estructurales del proyecto Obsidian Tower. ¿Te gustaría revisar los renders 3D iniciales ahora?",
        time: "10:42 AM",
        date: "MARTES, 24 OCT",
      },
      {
        id: 2,
        sender: "me",
        text: "Suena perfecto, Julian. La precisión arquitectónica es exactamente lo que buscamos. Adelante, compártelos.",
        time: "10:42 AM",
        status: "LEÍDO",
      },
      {
        id: 3,
        sender: "them",
        text: "Aquí tienes un adelanto de la entrada principal del lobby. Observa cómo el acabado de obsidiana interactúa con las matrices de luz lavanda.",
        time: "10:45 AM",
        image: {
          title: "Vista del Proyecto",
          subtitle: "Entrada del lobby",
        },
      },
    ],
  },
  {
    id: 2,
    name: "Elena Rossi",
    role: "Diseñadora de Interiores",
    avatar: "ER",
    lastMessage: "Te envié la paleta de colores...",
    time: "1H",
    online: false,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "Te envié la paleta de colores actualizada para la suite penthouse. ¡Déjame saber qué piensas!",
        time: "11:30 AM",
        date: "MARTES, 24 OCT",
      },
    ],
  },
  {
    id: 3,
    name: "Marcus Chen",
    role: "Project Manager",
    avatar: "MC",
    lastMessage: "¿Podemos agendar una llamada...",
    time: "AYER",
    online: false,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "¿Podemos agendar una llamada para este jueves? Necesitamos revisar la línea de tiempo del proyecto.",
        time: "3:15 PM",
        date: "LUNES, 23 OCT",
      },
    ],
  },
  {
    id: 4,
    name: "Sarah Jenkins",
    role: "Asesora Legal",
    avatar: "SJ",
    lastMessage: "El contrato ha sido firmado...",
    time: "2D",
    online: false,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "El contrato ha sido firmado y archivado. Toda la documentación está en orden para la siguiente fase.",
        time: "9:00 AM",
        date: "DOMINGO, 22 OCT",
      },
    ],
  },
  {
    id: 5,
    name: "Ana Torres",
    role: "Fotógrafa",
    avatar: "AT",
    lastMessage: "Las fotos del evento están...",
    time: "3D",
    online: true,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "Las fotos del evento están listas. Te envío el enlace del álbum en un momento.",
        time: "4:20 PM",
        date: "SÁBADO, 21 OCT",
      },
    ],
  },
];

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState(
    conversations[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileShowChat(true);
  };

  return (
    <div className="msg-app">
      <div className="msg-app__container">
        {/* ===== Top Bar ===== */}
        <header className="msg-topbar">
          <div className="msg-topbar__left">
            <button
              className="msg-topbar__back"
              onClick={() => navigate(-1)}
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

            <button
              className="msg-topbar__avatar"
              onClick={() => navigate(ROUTES.profile)}
              aria-label="Mi perfil"
            >
              {userInitials || <User size={18} />}
            </button>
          </div>
        </header>

        {/* ===== Main Layout ===== */}
        <div
          className={`msg-layout ${sidebarCollapsed ? "msg-layout--collapsed" : ""} ${mobileShowChat ? "msg-layout--chat-active" : ""}`}
        >
          {/* Conversations Panel */}
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
                    className={`msg-conv ${activeConversation.id === conv.id ? "msg-conv--active" : ""}`}
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
                    className={`msg-avatar-btn ${activeConversation.id === conv.id ? "msg-avatar-btn--active" : ""}`}
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

          {/* Chat Area */}
          <main className="msg-chat">
            {/* Chat Header */}
            <div className="msg-chat__header">
              <button
                className="msg-chat__back-mobile"
                onClick={() => setMobileShowChat(false)}
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="msg-chat__header-avatar">
                {activeConversation.avatar}
                {activeConversation.online && (
                  <span className="msg-online-dot" />
                )}
              </div>
              <div className="msg-chat__header-info">
                <span className="msg-chat__header-name">
                  {activeConversation.name}
                </span>
                <span className="msg-chat__header-status">
                  {activeConversation.online ? "En línea" : "Desconectado"} ·{" "}
                  {activeConversation.role}
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
                  aria-label="Más opciones"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="msg-chat__messages">
              {activeConversation.messages.map((msg) => (
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
                      {msg.image && (
                        <div className="msg-bubble__image">
                          <ImageIcon size={28} />
                          <div className="msg-bubble__image-info">
                            <span className="msg-bubble__image-title">
                              {msg.image.title}
                            </span>
                            <span className="msg-bubble__image-sub">
                              {msg.image.subtitle}
                            </span>
                          </div>
                        </div>
                      )}
                      <p>{msg.text}</p>
                    </div>
                    <span className="msg-bubble__time">
                      {msg.time}
                      {msg.status && ` · ${msg.status}`}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
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
                disabled={!newMessage.trim()}
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
