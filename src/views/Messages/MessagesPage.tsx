"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Paperclip,
  Smile,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  MoreVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import NavbarMessage from "../../components/Navbar/NavBar Messaje/NavbarMessage";
import { getProfessionalDetailAction } from "../../app/actions/professionals";
import {
  getMessagesAction,
  sendMessageAction,
  markMessagesAsReadAction,
  getUserConversationsAction,
  getProfileByUserIdAction,
  deleteChatAction,
} from "../../app/actions/chat";
import { sendNotificationAction } from "../../app/actions/notifications";
import { supabase } from "../../services/supabaseClient";
import {
  getFileSignedUrl,
  uploadChatImage,
} from "../../services/storageUploads";
import "./MessagesPage.css";

type UIConversation = {
  id: string;
  requestId?: string;
  receiverId?: string;
  professionalId?: number;
  seoPath?: string;
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
  senderProfile?: {
    display_name?: string;
    avatar_url?: string | null;
  } | null;
  fileUrl?: string;
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

const emojiCategories = {
  Caritas: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🫣",
    "🤫",
    "🤥",
    "😐",
    "😑",
    "😬",
    "🫠",
  ],
  Gestos: [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👍",
    "👎",
    "✊",
    "👊",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "✍️",
    "💅",
    "🤳",
    "💪",
  ],
  Amor: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❤️‍🔥",
    "❤️‍🩹",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
  ],
  Animal: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🦆",
    "🦅",
    "🦉",
    "🦇",
    "🦄",
    "🐝",
    "🦋",
    "🐌",
    "🐞",
    "🐜",
    "🕸️",
    "🐢",
    "🐍",
    "🐙",
    "🦀",
    "🐬",
    "🐳",
    "🦈",
  ],
  Comida: [
    "🍏",
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🫐",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
    "🥝",
    "🍅",
    "🍆",
    "🥑",
    "🥦",
    "🌽",
    "🥕",
    "🍞",
    "🧀",
    "🍳",
    "🥓",
    "🥩",
    "🍔",
    "🍟",
    "🍕",
    "🌭",
    "🥪",
    "🌮",
    "🍿",
    "🍩",
    "🍪",
    "🎂",
    "🧁",
    "🍫",
    "🍬",
    "🍭",
    "☕",
    "🍵",
    "🍺",
    "🍻",
    "🥂",
    "🍷",
    "🍹",
    "🥤",
  ],
};

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showWarning, showError, showSuccess } = useAlert();

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

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState("Caritas");
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Review reminder banner: track dismissed conversations
  const [dismissedReviewBanners, setDismissedReviewBanners] = useState<
    Set<string>
  >(() => {
    try {
      const stored = localStorage.getItem("dismissed_review_banners");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dismissReviewBanner = (convId: string) => {
    setDismissedReviewBanners((prev) => {
      const next = new Set(prev);
      next.add(convId);
      try {
        localStorage.setItem(
          "dismissed_review_banners",
          JSON.stringify(Array.from(next)),
        );
      } catch {}
      return next;
    });
  };

  const handleAddEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showWarning("El archivo excede el límite máximo permitido de 50MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const uploadResult = await uploadChatImage({
        file: file,
        fileName: file.name,
        contentType: file.type,
      });

      if (!uploadResult.publicUrl) {
        throw new Error("No se pudo obtener la ruta del archivo subido.");
      }

      const publicUrl = await getFileSignedUrl(uploadResult.publicUrl);

      sendMessageMutation.mutate({
        content: `Archivo adjunto: ${file.name}`,
        fileUrl: publicUrl,
      });
    } catch (err: any) {
      console.error("Error al subir archivo", err);
      showError(err.message || "Error al subir el archivo. Intente de nuevo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
          const otherId =
            String(req.user_id) === String(user.id)
              ? req.receiver_id
              : req.user_id;

          let profileData = null;
          if (otherId && String(otherId) !== String(user.id)) {
            try {
              const res = await getProfileByUserIdAction({
                id: String(otherId),
              });
              profileData = res?.data || res;
            } catch (e) {
              console.error("Error fetching profile", e);
            }
          }
          return { ...req, ProfileData: profileData };
        }),
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
        const res = await getProfessionalDetailAction({
          id: targetProfessional,
        });
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
      const otherId =
        String(req.user_id) === String(user?.id)
          ? req.receiver_id
          : req.user_id;

      const profileData = req.ProfileData || {};
      const professional = Array.isArray(profileData?.professionals)
        ? profileData.professionals[0]
        : profileData?.professionals;

      // Validamos si profileData tiene alguna propiedad relacionada a company o anidada en professionals
      const companyData =
        profileData?.companies_arca ||
        profileData?.companies ||
        profileData?.Company ||
        profileData?.company ||
        professional?.companies;
      const company = Array.isArray(companyData) ? companyData[0] : companyData;

      // Tiene professional_id si el req lo tiene, o si su perfil/relaciones lo indica
      const hasProfessionalId =
        !!req.professional_id ||
        !!profileData?.professional_id ||
        !!professional ||
        !!company;

      const name = hasProfessionalId
        ? company?.name ||
          profileData?.display_name ||
          `Profesional ${req.professional_id ?? ""}`
        : profileData?.display_name || "Usuario";

      const avatarImage =
        profileData?.avatar_url || company?.logo || company?.logo_url || null;

      const activityAt =
        lastActivityByRequest[String(req.id)] ||
        req.updated_at ||
        req.created_at;
      const activityTs = activityAt ? new Date(activityAt).getTime() : 0;

      return {
        id: String(req.id),
        requestId: String(req.id),
        receiverId: otherId,
        professionalId:
          Number(professional?.id || req.professional_id) || undefined,
        seoPath: professional?.seo_path || undefined,
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
      const company =
        targetProfData?.companies_arca ||
        targetProfData?.companies ||
        targetProfData?.company;
      const name = company?.name || `Profesional ${targetProfessional}`;
      const avatarImage = company?.logo || company?.logo_url || null;

      mapped.push({
        id: `draft-${targetProfessional}`,
        receiverId: targetProfData?.user_id,
        professionalId: Number(targetProfessional),
        seoPath: targetProfData?.seo_path || undefined,
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
    targetProfData,
  ]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    null;

  const showReviewBanner =
    !!activeConversation &&
    (activeConversation.role === "Profesional" ||
      !!activeConversation.professionalId) &&
    !dismissedReviewBanners.has(activeConversation.id);

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
      const res = await getMessagesAction({
        userId: String(user.id),
        receiverId: activeRequestId,
      });
      const result = res?.data || res || [];

      // Marcar como leídos
      if (user?.id) {
        await markMessagesAsReadAction({
          userId: String(user.id),
          senderId: activeRequestId,
        });
        setUnreadByRequest((prev) => ({ ...prev, [activeRequestId]: 0 }));
        queryClient.invalidateQueries({
          queryKey: ["unread-messages-count", user.id],
        });
      }
      return result;
    },
    enabled: !!activeRequestId,
    staleTime: 1000 * 30, // 30 segundos
    gcTime: 1000 * 60 * 2,
  });

  const messages = useMemo<UIMessage[]>(() => {
    const dataObj = messagesData as any;
    const list = Array.isArray(dataObj)
      ? dataObj
      : Array.isArray(dataObj?.messages)
        ? dataObj.messages
        : [];

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
        senderProfile: msg.sender,
        fileUrl: msg.file_url || undefined,
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
      .channel("messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;

          const isRelevant =
            newMsg.sender_id === user.id || newMsg.receiver_id === user.id;
          if (!isRelevant) return;

          const reqId =
            newMsg.sender_id === user.id
              ? newMsg.receiver_id
              : newMsg.sender_id;

          if (reqId === activeRequestId) {
            queryClient.invalidateQueries({
              queryKey: ["chat-messages", activeRequestId],
            });

            if (String(newMsg.sender_id) !== String(user.id)) {
              markMessagesAsReadAction({
                userId: String(user.id),
                senderId: reqId,
              }).then(() => {
                queryClient.invalidateQueries({
                  queryKey: ["unread-messages-count", user.id],
                });
              });
            }
          } else if (String(newMsg.sender_id) !== String(user.id)) {
            // Aumentar contador de no leídos para esa conversación
            setUnreadByRequest((prev) => ({
              ...prev,
              [reqId]: (prev[reqId] || 0) + 1,
            }));
          }

          queryClient.invalidateQueries({
            queryKey: ["my-conversations", user?.id],
          });

          setLastMessageByRequest((prev) => ({
            ...prev,
            [reqId]: newMsg.content,
          }));
          setLastActivityByRequest((prev) => ({
            ...prev,
            [reqId]: newMsg.created_at,
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeRequestId, queryClient]);

  const deleteChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) throw new Error("No authenticated user");
      return deleteChatAction({
        userId: String(user.id),
        otherUserId: String(otherUserId),
      });
    },
    onSuccess: () => {
      showSuccess("Conversación eliminada");
      queryClient.invalidateQueries({
        queryKey: ["my-conversations", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", activeRequestId],
      });
      queryClient.invalidateQueries({
        queryKey: ["unread-messages-count", user?.id],
      });
      setActiveConversationId("");
      setMobileShowChat(false);
      router.replace("/mensajes");
    },
    onError: (err: any) => {
      showError(err.message || "Error al eliminar la conversación");
    },
  });

  const handleDeleteChat = () => {
    if (!activeConversation) return;
    const otherUserId =
      activeRequestId || activeConversation.receiverId || activeConversation.id;
    if (!otherUserId) return;

    if (
      window.confirm(
        `¿Estás seguro de que querés eliminar la conversación con ${activeConversation.name}?`,
      )
    ) {
      deleteChatMutation.mutate(otherUserId);
    }
  };

  const sendMessageMutation = useMutation<
    { requestId: string; content: string; fileUrl?: string },
    Error,
    { content: string; fileUrl?: string }
  >({
    mutationFn: async ({ content, fileUrl }) => {
      if (!user?.id) throw new Error("No authenticated user");

      const receiverId = activeRequestId || activeConversation?.receiverId;
      if (!receiverId) {
        throw new Error(
          "No se pudo determinar el destinatario. Asegurese de que la info haya cargado.",
        );
      }

      const result = await sendMessageAction({
        senderId: String(user.id),
        receiverId,
        content,
        fileUrl,
      });

      const messageId = result?.data?.id;

      // Verificación de Lectura diferida (5 segundos)
      if (messageId) {
        setTimeout(async () => {
          try {
            // Consultar en Supabase el estado is_read del mensaje enviado
            const { data: msgData, error: msgErr } = await supabase
              .from("messages")
              .select("is_read")
              .eq("id", messageId)
              .single();

            // Si sigue sin leerse, enviar la notificación
            if (!msgErr && msgData && msgData.is_read === false) {
              await sendNotificationAction({
                user_id: receiverId,
                sender_id: String(user.id),
                type: "message",
                title: user.user_metadata?.full_name || "Usuario",
                content: content || "Archivo adjunto",
                source_id: String(messageId),
              });
            }
          } catch (notifErr) {
            console.error(
              "Error al verificar lectura diferida / enviar notificación:",
              notifErr,
            );
          }
        }, 10000);
      }

      return { requestId: receiverId, content, fileUrl };
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
          [result.requestId]: result.content || "Archivo adjunto",
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
    sendMessageMutation.mutate({ content });
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = async (conv: UIConversation) => {
    setActiveConversationId(conv.id);
    setMobileShowChat(true);
    setUnreadByRequest((prev) => ({ ...prev, [conv.id]: 0 }));
    if (conv.requestId && user?.id) {
      await markMessagesAsReadAction({
        userId: String(user.id),
        senderId: conv.requestId,
      });
      queryClient.invalidateQueries({
        queryKey: ["unread-messages-count", user.id],
      });
    }
  };

  const handleHeaderClick = async () => {
    if (!activeConversation) return;

    let professionalId = activeConversation.professionalId;
    let seoPath = activeConversation.seoPath;

    // Si no tenemos professionalId, pero es un Profesional o tiene un receiverId, intentamos buscarlo dinámicamente
    if (!professionalId && activeConversation.receiverId) {
      try {
        const res = await getProfileByUserIdAction({
          id: activeConversation.receiverId,
        });
        const profileData = res?.data || res;
        const professional = Array.isArray(profileData?.professionals)
          ? profileData.professionals[0]
          : profileData?.professionals;

        if (professional?.id) {
          professionalId = Number(professional.id);
          seoPath = professional.seo_path || undefined;
        }
      } catch (err) {
        console.error(
          "Error al buscar el perfil profesional dinámicamente:",
          err,
        );
      }
    }

    if (seoPath) {
      const path = seoPath.startsWith("/perfil")
        ? seoPath
        : `/perfil${seoPath.startsWith("/") ? seoPath : `/${seoPath}`}`;
      router.push(path);
    } else if (professionalId) {
      router.push(`/perfil/${professionalId}`);
    } else {
      // De respaldo, si tenemos el targetProfessional en la URL o guardado
      const backupId = targetProfessional || activeConversation.professionalId;
      if (backupId) {
        router.push(`/perfil/${backupId}`);
      }
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
                      <div className="msg-conv__row">
                        <p className="msg-conv__preview">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <span className="msg-unread-badge">
                            {conv.unreadCount}
                          </span>
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
                        <span className="msg-unread-badge msg-unread-badge--overlay">
                          {conv.unreadCount}
                        </span>
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
              <div
                className={`msg-chat__header-avatar ${activeConversation?.role === "Profesional" || activeConversation?.professionalId ? "msg-chat__header-avatar--clickable" : ""}`}
                onClick={handleHeaderClick}
              >
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
              <div
                className={`msg-chat__header-info ${activeConversation?.role === "Profesional" || activeConversation?.professionalId ? "msg-chat__header-info--clickable" : ""}`}
                onClick={handleHeaderClick}
              >
                <span
                  className="msg-chat__header-name"
                  onMouseEnter={(e) => {
                    if (
                      activeConversation?.role === "Profesional" ||
                      activeConversation?.professionalId
                    ) {
                      e.currentTarget.style.textDecoration = "underline";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {activeConversation?.name || "Selecciona una conversacion"}
                </span>
                <span className="msg-chat__header-status">
                  {activeConversation
                    ? `${activeConversation.online ? "En linea" : "Desconectado"} · ${activeConversation.role}`
                    : ""}
                </span>
              </div>
              <div className="msg-chat__header-actions">
                <button
                  className="msg-topbar__icon-btn msg-topbar__icon-btn--delete"
                  aria-label="Eliminar chat"
                  onClick={handleDeleteChat}
                  title="Eliminar chat"
                  disabled={deleteChatMutation.isPending}
                >
                  {deleteChatMutation.isPending ? (
                    <Loader2 size={18} className="msg-spin" />
                  ) : (
                    <Trash2 size={18} color="var(--error-color)" />
                  )}
                </button>
              </div>
            </div>

            {/* Review reminder banner */}
            {showReviewBanner && (
              <div className="msg-review-banner" role="status">
                <div className="msg-review-banner__icon">⭐</div>
                <div className="msg-review-banner__text">
                  <strong>¿Cómo resultó la atención?</strong>
                  <span>
                    Cuando termines de hablar con{" "}
                    <strong>{activeConversation?.name}</strong>, podés dejar una
                    reseña en su perfil para ayudar a otros usuarios.
                  </span>
                </div>
                <button
                  className="msg-review-banner__close"
                  onClick={() => dismissReviewBanner(activeConversation!.id)}
                  aria-label="Cerrar recordatorio"
                >
                  ×
                </button>
              </div>
            )}

            <div className="msg-chat__messages">
              {messages.map((msg) => {
                const isMe = msg.sender === "me";
                const profileName = isMe
                  ? "Yo"
                  : activeConversation?.name || "Usuario";
                const profileAvatar = !isMe
                  ? activeConversation?.avatarImage ||
                    "https://via.placeholder.com/32"
                  : "";

                return (
                  <div key={msg.id}>
                    {msg.date && (
                      <div className="msg-date-wrapper">
                        <span className="msg-date-bubble">{msg.date}</span>
                      </div>
                    )}
                    <div
                      className={`msg-bubble-wrap msg-bubble-wrap--${isMe ? "sent" : "received"}`}
                    >
                      <div
                        className={`msg-bubble msg-bubble--${isMe ? "sent" : "received"}`}
                      >
                        {/* WhatsApp like Tail */}
                        <div
                          className={`msg-bubble__tail msg-bubble__tail--${isMe ? "sent" : "received"}`}
                        />

                        {!isMe && (
                          <span className="msg-bubble__sender-name">
                            {msg.senderProfile?.display_name || profileName}
                          </span>
                        )}

                        <div className="msg-bubble__content">
                          <div className="msg-bubble__text-wrap">
                            {msg.fileUrl && (
                              <div className="msg-bubble__file">
                                {msg.fileUrl.match(
                                  /\.(jpeg|jpg|gif|png|webp)/i,
                                ) ||
                                msg.text.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                  <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={msg.fileUrl}
                                      alt="Imagen"
                                      className="msg-bubble__img"
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.opacity = "0.9")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.opacity = "1")
                                      }
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`msg-bubble__file-link msg-bubble__file-link--${isMe ? "sent" : "received"}`}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        isMe
                                          ? "rgba(255,255,255,0.25)"
                                          : "#e5e7eb")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        isMe
                                          ? "rgba(255,255,255,0.15)"
                                          : "#f3f4f6")
                                    }
                                  >
                                    <Paperclip size={16} />
                                    <span className="msg-bubble__file-name">
                                      {msg.text.replace(
                                        "Archivo adjunto: ",
                                        "",
                                      )}
                                    </span>
                                  </a>
                                )}
                              </div>
                            )}

                            {!msg.fileUrl && (
                              <span className="msg-bubble__text">
                                {msg.text}
                              </span>
                            )}
                          </div>
                          <span
                            className={`msg-bubble__time ${isMe ? "msg-bubble__time--sent" : ""}`}
                          >
                            {msg.time}
                            {isMe && (
                              <span
                                className={`msg-bubble__check ${msg.status === "Leído" ? "msg-bubble__check--read" : ""}`}
                              >
                                {msg.status === "Leído" ? "✓✓" : "✓"}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!messages.length && (
                <div className="msg-empty-state">
                  <span className="msg-empty-state__text">
                    Envía un mensaje para iniciar la conversación
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="msg-input">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="msg-input__file-hidden"
              />
              <button
                type="button"
                className="msg-input__icon"
                aria-label="Adjuntar archivo"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2
                    size={20}
                    className="animate-spin msg-input__icon--accent"
                  />
                ) : (
                  <Paperclip size={20} />
                )}
              </button>
              <input
                type="text"
                className="msg-input__field"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="msg-emoji-wrapper" ref={emojiPickerRef}>
                <button
                  type="button"
                  className="msg-input__icon"
                  aria-label="Emoji"
                  onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                >
                  <Smile
                    size={20}
                    className={emojiPickerOpen ? "msg-input__icon--accent" : ""}
                  />
                </button>

                {emojiPickerOpen && (
                  <div className="msg-emoji-picker">
                    {/* Header / Tabs */}
                    <div className="msg-emoji-tabs">
                      {Object.keys(emojiCategories).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveEmojiCat(cat)}
                          className={`msg-emoji-tab ${activeEmojiCat === cat ? "msg-emoji-tab--active" : ""}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Emojis Grid */}
                    <div className="msg-emoji-grid">
                      {emojiCategories[
                        activeEmojiCat as keyof typeof emojiCategories
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddEmoji(emoji)}
                          className="msg-emoji-btn"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
