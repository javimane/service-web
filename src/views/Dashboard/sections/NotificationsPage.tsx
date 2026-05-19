"use client";
import { useState, useEffect } from "react";
import {
  Bell,
  FileText,
  MessageSquare,
  Ticket,
  TrendingUp,
  Star,
  UserPlus,
  CheckCheck,
  Filter,
} from "lucide-react";
import { notificationStorage } from "../../../services/notificationStorage";
import "./NotificationsPage.css";

const CATEGORY_ICONS = {
  proposals: FileText,
  messages: MessageSquare,
  promotions: Ticket,
  analytics: TrendingUp,
  reviews: Star,
  followers: UserPlus,
  all: Bell,
};

const filterOptions = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "No leídas" },
  { key: "proposals", label: "Propuestas" },
  { key: "messages", label: "Mensajes" },
  { key: "promotions", label: "Promociones" },
  { key: "analytics", label: "Analíticas" },
];

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  useEffect(() => {
    return notificationStorage.subscribe((notifs) => {
      setNotificationsList(notifs);
    });
  }, []);

  const filtered = notificationsList.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return n.unread;
    return n.category === activeFilter;
  });

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof notificationsList>>(
    (acc, n) => {
      const dateKey = n.date || "Hoy";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(n);
      return acc;
    },
    {},
  );

  const handleMarkAllAsRead = () => {
    notificationStorage.markAllAsRead();
  };

  const handleMarkSingleAsRead = (id: string | number) => {
    notificationStorage.markAsRead(id);
  };

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
            onClick={handleMarkAllAsRead}
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
        {Object.entries(grouped).length === 0 ? (
          <div className="notifications-page__empty">
            <Bell size={48} />
            <p>No hay notificaciones en esta categoría.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="notifications-group">
              <h3 className="notifications-group__date">{date}</h3>
              <div className="notifications-group__list">
                {items.map((notif) => {
                  const IconComp = CATEGORY_ICONS[notif.category as keyof typeof CATEGORY_ICONS] || Bell;
                  return (
                    <div
                      key={notif.id}
                      className={`notification-card ${notif.unread ? "notification-card--unread" : ""}`}
                      onClick={() => handleMarkSingleAsRead(notif.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className={`notification-card__icon notification-card__icon--${notif.iconColor || "blue"}`}
                      >
                        <IconComp size={20} />
                      </div>
                      <div className="notification-card__body">
                        <div className="notification-card__top">
                          <span className="notification-card__title">
                            {notif.title}
                          </span>
                          <span className="notification-card__time">
                            {notif.time}
                          </span>
                        </div>
                        <p className="notification-card__desc">
                          {notif.description}
                        </p>
                      </div>
                      {notif.unread && (
                        <div className="notification-card__unread-dot" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
