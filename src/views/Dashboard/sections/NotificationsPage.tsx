"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../../routes/paths";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Heart,
  MessageSquare,
  Briefcase,
  CheckCheck,
  Filter,
  Trash2,
  Ticket
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  getNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
  deleteNotificationAction,
} from "../../../app/actions/notifications";
import "./NotificationsPage.css";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return { icon: Heart, color: "red" };
    case "comment":
      return { icon: MessageSquare, color: "blue" };
    case "propossal":
      return { icon: Briefcase, color: "purple" };
    case "message":
      return { icon: MessageSquare, color: "green" };
    case "promotion":
      return { icon: Ticket, color: "orange" };
    default:
      return { icon: Bell, color: "gray" };
  }
};

const filterOptions = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "No leídas" },
  { key: "propossal", label: "Propuestas" },
  { key: "message", label: "Mensajes" },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: notificationsList = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await getNotificationsAction({});
      if (res?.data) {
        if (Array.isArray(res.data)) return res.data;
        if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
      }
      return [];
    },
    enabled: !!user?.id,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await markAllNotificationsAsReadAction({});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await markNotificationAsReadAction({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteNotificationAction({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) {
      markAsReadMutation.mutate(notif.id);
    }
    
    switch (notif.type) {
      case "proposal":
      case "propossal":
        router.push(`${ROUTES.dashboard}?view=proposals-view`);
        break;
      case "message":
        router.push(ROUTES.messages);
        break;
      case "promotion":
        router.push(`${ROUTES.dashboard}?view=promotions-all`);
        break;
    }
  };

  const filtered = notificationsList.filter((n: any) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.is_read;
    return n.type === activeFilter;
  });

  const unreadCount = notificationsList.filter((n: any) => !n.is_read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-page__header">
        <div className="notifications-page__title-row">
          <div className="notifications-page__title-group">
            <Bell size={24} />
            <h1>Notificaciones</h1>
            {unreadCount > 0 && (
              <span className="notifications-page__badge">{unreadCount}</span>
            )}
          </div>
          <button 
            type="button" 
            className="notifications-page__mark-all"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
          >
            <CheckCheck size={16} />
            <span>Marcar todas como leídas</span>
          </button>
        </div>

        <div className="notifications-page__filters">
          <Filter size={16} className="notifications-page__filter-icon" />
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`notifications-page__filter-chip ${activeFilter === opt.key ? "active" : ""}`}
              onClick={() => setActiveFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="notifications-page__content">
        {isLoading ? (
          <div className="notifications-page__empty">
            <p>Cargando notificaciones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notifications-page__empty">
            <Bell size={48} />
            <p>No hay notificaciones en esta categoría.</p>
          </div>
        ) : (
          <div className="notifications-group__list">
            {filtered.map((notif: any) => {
              const { icon: IconComp, color } = getNotificationIcon(notif.type);
              
              let timeStr = "";
              try {
                timeStr = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es });
              } catch (e) {
                timeStr = "Recientemente";
              }

              return (
                <div
                  key={notif.id}
                  className={`notification-card ${!notif.is_read ? "notification-card--unread" : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className={`notification-card__icon notification-card__icon--${color}`}
                  >
                    <IconComp size={20} />
                  </div>
                  <div className="notification-card__body">
                    <div className="notification-card__top">
                      <span className="notification-card__title">
                        {notif.title}
                      </span>
                      <span className="notification-card__time">
                        {timeStr}
                      </span>
                    </div>
                    <p className="notification-card__desc">
                      {notif.content}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!notif.is_read && (
                      <div className="notification-card__unread-dot" />
                    )}
                    {!notif.is_read && (
                      <button
                        title="Marcar como leída"
                        onClick={(e) => { e.stopPropagation(); markAsReadMutation.mutate(notif.id); }}
                        disabled={markAsReadMutation.isPending}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success-color)' }}
                      >
                        <CheckCheck size={20} />
                      </button>
                    )}
                    <button
                      title="Eliminar"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
                      disabled={deleteMutation.isPending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
