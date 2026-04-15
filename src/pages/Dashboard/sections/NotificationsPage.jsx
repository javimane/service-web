import { useState } from "react";
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
import "./NotificationsPage.css";

const allNotifications = [
  {
    id: 1,
    icon: FileText,
    iconColor: "blue",
    category: "proposals",
    title: "Propuesta aceptada",
    description:
      'Tu propuesta "Remodelación Terraza" fue aprobada por el cliente. Puedes proceder con la planificación.',
    time: "Hace 5 min",
    date: "Hoy",
    unread: true,
  },
  {
    id: 2,
    icon: MessageSquare,
    iconColor: "green",
    category: "messages",
    title: "Nuevo mensaje de Julian Vargas",
    description:
      "Julian te envió los planos del proyecto Obsidian Tower para tu revisión.",
    time: "Hace 30 min",
    date: "Hoy",
    unread: true,
  },
  {
    id: 3,
    icon: Ticket,
    iconColor: "orange",
    category: "promotions",
    title: "Promoción por vencer",
    description:
      'Tu promoción "Descuento 20% en consultas" expira en 2 días. Considera renovarla.',
    time: "Hace 1 hora",
    date: "Hoy",
    unread: true,
  },
  {
    id: 4,
    icon: TrendingUp,
    iconColor: "purple",
    category: "analytics",
    title: "Estadísticas semanales disponibles",
    description:
      "Tu perfil creció un +12.4% esta semana. Revisa el reporte completo en Analytics.",
    time: "Hace 3 horas",
    date: "Hoy",
    unread: false,
  },
  {
    id: 5,
    icon: Star,
    iconColor: "yellow",
    category: "reviews",
    title: "Nueva reseña de 5 estrellas",
    description:
      'Elena Rossi dejó una reseña: "Excelente trabajo, muy profesional y detallista."',
    time: "Hace 6 horas",
    date: "Hoy",
    unread: false,
  },
  {
    id: 6,
    icon: UserPlus,
    iconColor: "green",
    category: "followers",
    title: "Nuevo seguidor",
    description: "Marcus Chen comenzó a seguir tu perfil profesional.",
    time: "Ayer",
    date: "Ayer",
    unread: false,
  },
  {
    id: 7,
    icon: FileText,
    iconColor: "blue",
    category: "proposals",
    title: "Propuesta enviada",
    description:
      'Tu propuesta "Diseño de interiores Studio Loft" fue enviada correctamente al cliente.',
    time: "Ayer",
    date: "Ayer",
    unread: false,
  },
  {
    id: 8,
    icon: Ticket,
    iconColor: "orange",
    category: "promotions",
    title: "Promoción activada",
    description:
      'Tu nueva promoción "Pack Consulta + Diseño" ya está visible en la plataforma.',
    time: "Hace 2 días",
    date: "14 Abr",
    unread: false,
  },
  {
    id: 9,
    icon: MessageSquare,
    iconColor: "green",
    category: "messages",
    title: "Mensaje de Sarah Jenkins",
    description:
      "Sarah confirmó que el contrato fue firmado y registrado correctamente.",
    time: "Hace 2 días",
    date: "14 Abr",
    unread: false,
  },
  {
    id: 10,
    icon: TrendingUp,
    iconColor: "purple",
    category: "analytics",
    title: "Hito alcanzado: 1000 visitas",
    description: "Tu perfil alcanzó las 1000 visitas este mes. ¡Felicidades!",
    time: "Hace 3 días",
    date: "13 Abr",
    unread: false,
  },
];

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

  const filtered = allNotifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return n.unread;
    return n.category === activeFilter;
  });

  const unreadCount = allNotifications.filter((n) => n.unread).length;

  // Group by date
  const grouped = filtered.reduce((acc, n) => {
    if (!acc[n.date]) acc[n.date] = [];
    acc[n.date].push(n);
    return acc;
  }, {});

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
          <button type="button" className="notifications-page__mark-all">
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
                  const IconComp = notif.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`notification-card ${notif.unread ? "notification-card--unread" : ""}`}
                    >
                      <div
                        className={`notification-card__icon notification-card__icon--${notif.iconColor}`}
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
