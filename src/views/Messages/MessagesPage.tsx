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
import { getProfileAction } from "../../app/actions/profile";
import { getProfessionalDetailAction } from "../../app/actions/professionals";
import { getMessagesAction, sendMessageAction, markMessagesAsReadAction, getUserConversationsAction } from "../../app/actions/chat";
import { supabase } from "../../services/supabaseClient";
import "./MessagesPage.css";

type UIConversation = {
  id: string;
  requestId?: string;
  receiverId?: string;
  professionalId?: number;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
  time: string;
  lastMessage: string;
  avatarImage?: string | null;
  sortTs: number;
  unreadCount: number;
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
  const initialMessage = searchParams?.get("initialMessage") || "";

  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState(initialMessage);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [lastMessageByRequest, setLastMessageByRequest] = useState<
    Record<string, string>
  >({});
  const [lastActivityByRequest, setLastActivityByRequest] = useState<
    Record<string, string>
  >({});
  const [unreadByRequest, setUnreadByRequest] = useState<
    Record<string, number>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: requestsData } = useQuery({
    queryKey: ["my-conversations", user?.id],
    queryFn: async () => {
      const res = await getUserConversationsAction({ userId: String(user.id) });
      const result = res?.data || res || [];

      if (!Array.isArray(result)) {
        return [];
      }

      const enriched = await Promise.all(
        result.map(async (req: any) => {
          // Identify the other user's ID
          const otherId = String(req.user_id) === String(user.id)
            ? req.receiver_id
            : req.user_id;

          let profileData = null;
          if (otherId && String(otherId) !== String(user.id)) {
            try {
              const res = await getProfileAction({ id: String(otherId) });
              profileData = res?.data || res;
            } catch (e) {
              console.error("Error fetching profile", e);
            }
          }
          return { ...req, ProfileData: profileData };
        })
      );

      return enriched;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 segundos
    gcTime: 1000 * 60 * 2,
  });

  const { data: targetProfData } = useQuery({
    queryKey: ["professional-detail-chat", targetProfessional],
    queryFn: async () => {
      if (!targetProfessional) return null;
      try {
        const res = await getProfessionalDetailAction({ id: targetProfessional });
        return res?.data || res;
      } catch (e) {
        console.error("Error fetching target professional", e);
        return null;
      }
    },
    enabled: !!targetProfessional,
  });

  const requests = useMemo(() => {
    if (!requestsData) return [] as any[];
    return requestsData;
  }, [requestsData]);

  const conversations = useMemo<UIConversation[]>(() => {
    const mapped: UIConversation[] = requests.map((req: any) => {
      const otherId = String(req.user_id) === String(user?.id) 
        ? req.receiver_id 
        : req.user_id;
      
      const profileData = req.ProfileData || {};
      
      // Validamos si profileData tiene alguna propiedad relacionada a company
      const companyData = profileData?.companies_arca || profileData?.companies || profileData?.Company || profileData?.company;
      const company = Array.isArray(companyData) ? companyData[0] : companyData;
      
      // Tiene professional_id si el req lo tiene, o si su perfil lo indica
      const hasProfessionalId = !!req.professional_id || !!profileData?.professional_id || !!company;
      
      const name = hasProfessionalId 
        ? (company?.name || profileData?.display_name || `Profesional ${req.professional_id ?? ""}`) 
        : (profileData?.display_name || "Usuario");

      const avatarImage = profileData?.avatar_url || company?.logo || company?.logo_url || null;

      const activityAt =
        lastActivityByRequest[String(req.id)] ||
        req.updated_at ||
        req.created_at;
      const activityTs = activityAt ? new Date(activityAt).getTime() : 0;

      return {
        id: String(req.id),
        requestId: String(req.id),
        receiverId: otherId,
        professionalId: Number(req.professional_id) || undefined,
        name,
        role: hasProfessionalId ? "Profesional" : "Usuario",
        avatar: getInitials(name),
        avatarImage,
        online: false,
        time: formatTime(activityAt),
        lastMessage:
          lastMessageByRequest[String(req.id)] ||
          req.message ||
          "Abri la conversacion para ver mensajes",
        sortTs: Number.isFinite(activityTs) ? activityTs : 0,
        unreadCount: unreadByRequest[String(req.id)] || 0,
      };
    });

    if (mapped.length === 0 && targetProfessional) {
      const company = targetProfData?.companies_arca || targetProfData?.companies || targetProfData?.company;
      const name = company?.name || `Profesional ${targetProfessional}`;
      const avatarImage = company?.logo || company?.logo_url || null;
      
      mapped.push({
        id: `draft-${targetProfessional}`,
        receiverId: targetProfData?.user_id,
        professionalId: Number(targetProfessional),
        name,
        role: "Profesional",
        avatar: getInitials(name),
        avatarImage,
        online: false,
        time: "",
        lastMessage: "Envia el primer mensaje para iniciar el chat",
        sortTs: -1,
        unreadCount: 0,
      });
    }

    mapped.sort((a, b) => b.sortTs - a.sortTs);

    return mapped;
  }, [
    requests,
    targetProfessional,
    lastMessageByRequest,
    lastActivityByRequest,
    unreadByRequest,
    targetProfData
  ]);

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
      if (!activeRequestId) return [];
      const res = await getMessagesAction({ userId: String(user.id), receiverId: activeRequestId });
      const result = res?.data || res || [];
      
      // Marcar como leídos
      if (user?.id) {
         await markMessagesAsReadAction({ userId: String(user.id), senderId: activeRequestId });
         setUnreadByRequest(prev => ({...prev, [activeRequestId]: 0}));
      }
      return result;
    },
    enabled: !!activeRequestId,
    staleTime: 1000 * 30, // 30 segundos
    gcTime: 1000 * 60 * 2,
  });

  const messages = useMemo<UIMessage[]>(() => {
    const dataObj = messagesData as any;
    const list = Array.isArray(dataObj) ? dataObj : Array.isArray(dataObj?.messages) ? dataObj.messages : [];

    let lastDate = "";
    return list.map((msg: any) => {
      const msgDate = formatDate(msg.created_at);
      const showDate = msgDate && msgDate !== lastDate;
      if (msgDate) lastDate = msgDate;

      return {
        id: String(msg.id),
        sender: String(msg.sender_id) === String(user?.id) ? "me" : "other",
        text: msg.content,
        time: formatTime(msg.created_at),
        date: showDate ? msgDate : "",
        status: msg.is_read ? "Leído" : undefined,
      };
    });
  }, [messagesData, user?.id]);

  useEffect(() => {
    if (!activeRequestId || messages.length === 0) return;

    const latest = messages[messages.length - 1]?.text?.trim();
    if (!latest) return;

    setLastMessageByRequest((prev) =>
      prev[activeRequestId] === latest
        ? prev
        : { ...prev, [activeRequestId]: latest },
    );
  }, [activeRequestId, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new;
          
          const isRelevant = newMsg.sender_id === user.id || newMsg.receiver_id === user.id;
          if (!isRelevant) return;

          const reqId = newMsg.sender_id === user.id ? newMsg.receiver_id : newMsg.sender_id;
          
          if (reqId === activeRequestId) {
            queryClient.setQueryData(["chat-messages", activeRequestId], (oldData: any) => {
              if (!oldData) return [newMsg];
              if (oldData.some((m: any) => m.id === newMsg.id)) return oldData;
              return [...oldData, newMsg];
            });
            
            if (String(newMsg.sender_id) !== String(user.id)) {
               markMessagesAsReadAction({ userId: String(user.id), senderId: reqId });
            }
          } else if (String(newMsg.sender_id) !== String(user.id)) {
            // Aumentar contador de no leídos para esa conversación
            setUnreadByRequest(prev => ({
               ...prev,
               [reqId]: (prev[reqId] || 0) + 1
            }));
          }
          
          setLastMessageByRequest((prev) => ({
             ...prev,
             [reqId]: newMsg.content
          }));
          setLastActivityByRequest((prev) => ({
             ...prev,
             [reqId]: newMsg.created_at
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeRequestId, queryClient]);

  const sendMessageMutation = useMutation<
    { requestId: string; content: string },
    Error,
    string
  >({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("No authententicated user");

      const receiverId = activeRequestId || activeConversation?.receiverId;
      if (!receiverId) {
        throw new Error("No se pudo determinar el destinatario. Asegurese de que la info haya cargado.");
      }

      await sendMessageAction({ senderId: String(user.id), receiverId, content });
      
      return { requestId: receiverId, content };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["my-conversations", user?.id],
      });
      if (result.requestId) {
        const nowIso = new Date().toISOString();
        queryClient.invalidateQueries({
          queryKey: ["chat-messages", result.requestId],
        });
        setLastMessageByRequest((prev) => ({
          ...prev,
          [result.requestId]: result.content,
        }));
        setLastActivityByRequest((prev) => ({
          ...prev,
          [result.requestId]: nowIso,
        }));
      }

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
    setUnreadByRequest(prev => ({...prev, [conv.id]: 0}));
    if (conv.requestId && user?.id) {
       markMessagesAsReadAction({ userId: String(user.id), senderId: conv.requestId });
    }
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
                      {conv.avatarImage ? (
                        <img
                          src={conv.avatarImage}
                          alt={conv.name}
                          className="msg-avatar-img"
                        />
                      ) : (
                        conv.avatar
                      )}
                      {conv.online && <span className="msg-online-dot" />}
                    </div>
                    <div className="msg-conv__body">
                      <div className="msg-conv__row">
                        <span className="msg-conv__name">{conv.name}</span>
                        <span className="msg-conv__time">{conv.time}</span>
                      </div>
                      <div className="msg-conv__row" style={{ marginTop: '2px' }}>
                        <p className="msg-conv__preview" style={{ flex: 1, marginRight: '8px' }}>{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <span className="msg-unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
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
                    style={{ position: 'relative' }}
                  >
                    <div className="msg-conv__avatar">
                      {conv.avatarImage ? (
                        <img
                          src={conv.avatarImage}
                          alt={conv.name}
                          className="msg-avatar-img"
                        />
                      ) : (
                        conv.avatar
                      )}
                      {conv.online && <span className="msg-online-dot" />}
                      {conv.unreadCount > 0 && (
                        <span className="msg-unread-badge" style={{ position: 'absolute', top: -4, right: -4, zIndex: 10 }}>{conv.unreadCount}</span>
                      )}
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
                {activeConversation?.avatarImage ? (
                  <img
                    src={activeConversation.avatarImage}
                    alt="Avatar"
                    className="msg-avatar-img"
                  />
                ) : (
                  activeConversation?.avatar || "--"
                )}
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

            <div className="msg-chat__messages bg-gray-50 flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender === "me";
                const profileName = isMe ? "Yo" : (activeConversation?.name || "Usuario");
                const profileAvatar = !isMe ? (activeConversation?.avatarImage || "https://via.placeholder.com/32") : "";

                return (
                  <div key={msg.id}>
                    {msg.date && (
                      <div className="flex items-center justify-center py-2">
                        <span className="text-[10px] font-bold text-gray-500 bg-white px-3 py-1 rounded-full border">
                          {msg.date}
                        </span>
                      </div>
                    )}
                    <div className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      
                      {!isMe && (
                        <div className="flex-shrink-0 mt-0.5">
                          {activeConversation?.avatarImage ? (
                            <img
                              src={profileAvatar}
                              alt="avatar"
                              className="w-8 h-8 rounded-full object-cover bg-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {activeConversation?.avatar || "US"}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {!isMe && (
                          <span className="text-[11px] text-gray-500 mb-0.5 px-1">
                            {profileName}
                          </span>
                        )}
                        
                        <div className={`p-3 rounded-lg text-sm shadow-sm ${
                          isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none'
                        }`}>
                          <p className="break-words m-0">{msg.text}</p>
                        </div>

                        <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          {msg.time}
                          {isMe && (
                            <span className={msg.status === 'Leído' ? 'text-blue-500 font-bold' : ''}>
                              {msg.status === 'Leído' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!messages.length && (
                <div className="flex items-center justify-center py-4">
                  <span className="text-xs text-gray-500 bg-white px-4 py-2 rounded-full border shadow-sm">
                    Envía un mensaje para iniciar la conversación
                  </span>
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
